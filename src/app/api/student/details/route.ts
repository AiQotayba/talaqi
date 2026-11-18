import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UserDetails from '@/models/UserDetails';
import { getAuthUser } from '@/lib/auth';
import waSend from '@/lib/wa';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. IP-level rate limit: 40 requests per 10 minutes (generous for shared NAT/networks in Syria)
    const ipLimitCheck = checkRateLimit(`apply-ip:${clientIp}`, 40, 10 * 60 * 1000);
    if (!ipLimitCheck.success) {
      return rateLimitResponse(ipLimitCheck, 'تم تجاوز الحد الأقصى للطلبات من هذه الشبكة. يرجى الانتظار قليلاً.');
    }

    // 2. Client fingerprint rate limit: 15 requests per 10 minutes
    const fingerprintKey = `apply-fp:${clientIp}:${userAgent.slice(0, 50)}`;
    const fpLimitCheck = checkRateLimit(fingerprintKey, 15, 10 * 60 * 1000);
    if (!fpLimitCheck.success) {
      return rateLimitResponse(fpLimitCheck, 'تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار والمحاولة لاحقاً.');
    }

    const rawBody = await req.json();
    const authUser = await getAuthUser(req);

    // 3. Whitelist, validate, and sanitize fields
    const rawFullName = typeof rawBody.fullName === 'string' && rawBody.fullName.trim()
      ? rawBody.fullName.trim()
      : (authUser?.name || 'طالب جديد');
    const fullName = rawFullName.slice(0, 100);

    const rawPhone = typeof rawBody.phone === 'string' && rawBody.phone.trim()
      ? rawBody.phone.trim()
      : (authUser?.phone || '');
    const phone = rawPhone.slice(0, 30);

    const rawEmail = typeof rawBody.email === 'string' && rawBody.email.trim()
      ? rawBody.email.toLowerCase().trim()
      : (authUser?.email || '');
    const email = rawEmail.slice(0, 100);

    // Rate limit per phone or email if provided (prevent spamming notifications)
    if (phone) {
      const phoneLimitCheck = checkRateLimit(`apply-phone:${phone}`, 5, 10 * 60 * 1000);
      if (!phoneLimitCheck.success) {
        return rateLimitResponse(phoneLimitCheck, 'تم استلام طلبك بالفعل لهذا الرقم. يرجى الانتظار قبل إرسال طلب جديد.');
      }
    } else if (email) {
      const emailLimitCheck = checkRateLimit(`apply-email:${email}`, 5, 10 * 60 * 1000);
      if (!emailLimitCheck.success) {
        return rateLimitResponse(emailLimitCheck, 'تم استلام طلبك بالفعل لهذا البريد. يرجى الانتظار قبل إرسال طلب جديد.');
      }
    }

    // Format birth year if provided
    let births = 2000;
    if (rawBody.births) {
      const birthDate = new Date(rawBody.births);
      if (!isNaN(birthDate.getTime())) {
        const formatted = birthDate.toJSON().split('T')[0].replaceAll('-', '');
        births = Number(formatted) || 2000;
      } else {
        births = Number(rawBody.births) || 2000;
      }
    }
    if (births < 1940 || births > 2026) {
      births = 2000;
    }

    const district = typeof rawBody.District === 'string' ? rawBody.District.trim().slice(0, 50) : 'إدلب';
    const city = typeof rawBody.city === 'string' ? rawBody.city.trim().slice(0, 50) : district;
    const nationality = typeof rawBody.nationality === 'string' ? rawBody.nationality.trim().slice(0, 50) : 'سوري';
    const interests = typeof rawBody.interests === 'string' ? rawBody.interests.trim().slice(0, 500) : '';

    const VALID_EDUCATION_LEVELS = ['Primary', 'Intermediate', 'Secondary', 'Bachelors', 'Masters', 'PhD', 'Diploma', 'Institute', 'Other'];
    const educationLevel = VALID_EDUCATION_LEVELS.includes(rawBody.educationLevel) ? rawBody.educationLevel : 'Secondary';

    const specialization = typeof rawBody.specialization === 'string' ? rawBody.specialization.trim().slice(0, 100) : '';
    const classes = typeof rawBody.classes === 'string' ? rawBody.classes.trim().slice(0, 50) : '';
    const englishLevel = typeof rawBody.englishLevel === 'string' ? rawBody.englishLevel.trim().slice(0, 50) : '';
    const computerUsage = typeof rawBody.computerUsage === 'string' ? rawBody.computerUsage.trim().slice(0, 50) : '';
    const freeCourses = rawBody.freeCourses !== undefined ? Boolean(rawBody.freeCourses) : true;
    const paidCourses = Boolean(rawBody.paidCourses);
    const paidCoursesLimit = Math.min(Math.max(Number(rawBody.paidCoursesLimit) || 0, 0), 10000);
    const work = typeof rawBody.work === 'string' ? rawBody.work.trim().slice(0, 100) : '';
    const requiredCourses = Array.isArray(rawBody.requiredCourses)
      ? rawBody.requiredCourses.slice(0, 20).filter((c: any) => typeof c === 'string').map((c: string) => c.slice(0, 100))
      : [];

    const newRecord: Record<string, any> = {
      fullName,
      phone,
      email,
      births,
      District: district,
      city,
      nationality,
      interests,
      educationLevel,
      specialization,
      classes,
      englishLevel,
      computerUsage,
      freeCourses,
      paidCourses,
      paidCoursesLimit,
      requiredCourses,
      work,
      deleteState: false,
    };

    // CRITICAL SECURITY RULE: Never accept user_id from client body.
    // user_id is ONLY set from verified session if authenticated.
    if (authUser) {
      newRecord.user_id = authUser._id;
    } else {
      newRecord.user_id = null;
    }

    await connectToDatabase();
    const newUserDetails = await UserDetails.create(newRecord);

    // Safe WhatsApp notification (non-blocking, failure never affects submission)
    try {
      await waSend(
        '96170723177',
        `> تم تسجيل رغبة تدريبية جديدة *${(newUserDetails.fullName || '').trim()}*\n📞 ${newUserDetails.phone}\n🎯 الدورة المطلوبة: ${newUserDetails.interests || 'غير محدد'}\n📍 المنطقة: ${newUserDetails.District || ''}`
      );
    } catch (waErr) {
      console.warn('WhatsApp notify failed:', waErr);
    }

    return NextResponse.json(
      {
        message: 'تم تسجيل طلبك بنجاح',
        data: {
          _id: newUserDetails._id,
          fullName: newUserDetails.fullName,
          interests: newUserDetails.interests,
          city: newUserDetails.city,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user details:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تسجيل الطلب. يرجى المحاولة ثانية.' },
      { status: 500 }
    );
  }
}
