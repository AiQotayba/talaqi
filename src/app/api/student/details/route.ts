import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UserDetails from '@/models/UserDetails';
import { getAuthUser } from '@/lib/auth';
import waSend from '@/lib/wa';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const authUser = await getAuthUser(req);

    // Whitelist and sanitize fields
    const fullName = typeof rawBody.fullName === 'string' && rawBody.fullName.trim()
      ? rawBody.fullName.trim()
      : (authUser?.name || 'طالب جديد');

    const phone = typeof rawBody.phone === 'string' && rawBody.phone.trim()
      ? rawBody.phone.trim()
      : (authUser?.phone || '');

    const email = typeof rawBody.email === 'string' && rawBody.email.trim()
      ? rawBody.email.toLowerCase().trim()
      : (authUser?.email || '');

    // Format birth year if provided, otherwise default to 2000
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

    const district = typeof rawBody.District === 'string' ? rawBody.District.trim() : 'إدلب';
    const city = typeof rawBody.city === 'string' ? rawBody.city.trim() : district;
    const nationality = typeof rawBody.nationality === 'string' ? rawBody.nationality.trim() : 'سوري';
    const interests = typeof rawBody.interests === 'string' ? rawBody.interests.trim() : '';
    const educationLevel = typeof rawBody.educationLevel === 'string' ? rawBody.educationLevel : 'Secondary';
    const specialization = typeof rawBody.specialization === 'string' ? rawBody.specialization.trim() : '';
    const classes = typeof rawBody.classes === 'string' ? rawBody.classes.trim() : '';
    const englishLevel = typeof rawBody.englishLevel === 'string' ? rawBody.englishLevel.trim() : '';
    const computerUsage = typeof rawBody.computerUsage === 'string' ? rawBody.computerUsage.trim() : '';
    const freeCourses = rawBody.freeCourses !== undefined ? Boolean(rawBody.freeCourses) : true;
    const paidCourses = Boolean(rawBody.paidCourses);
    const paidCoursesLimit = Number(rawBody.paidCoursesLimit) || 0;
    const work = typeof rawBody.work === 'string' ? rawBody.work.trim() : '';
    const requiredCourses = Array.isArray(rawBody.requiredCourses)
      ? rawBody.requiredCourses.filter((c: any) => typeof c === 'string')
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

    // CRITICAL SECURITY FIX: Never accept user_id from client body.
    // user_id is ONLY set from verified session if authenticated.
    if (authUser) {
      newRecord.user_id = authUser._id;
    } else {
      newRecord.user_id = null;
    }

    await connectToDatabase();
    const newUserDetails = await UserDetails.create(newRecord);

    // Optional WhatsApp notification
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
