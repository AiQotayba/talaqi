import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UserDetails from '@/models/UserDetails';
import { getAuthUser } from '@/lib/auth';

// Whitelist of fields a student is allowed to update on their profile
const ALLOWED_PROFILE_FIELDS = [
  'fullName',
  'phone',
  'email',
  'births',
  'District',
  'city',
  'nationality',
  'interests',
  'educationLevel',
  'specialization',
  'classes',
  'graduationYear',
  'englishLevel',
  'computerUsage',
  'freeCourses',
  'paidCourses',
  'paidCoursesLimit',
  'requiredCourses',
  'work',
] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Strictly find profile by authenticated user_id
    let details = await UserDetails.findOne({
      user_id: user._id,
      deleteState: false,
    });

    // 2. Safe one-time fallback migration for legacy unlinked records:
    // Only link if there is a strict and verified correlation to prevent account/data takeover.
    if (!details) {
      const cleanEmail = typeof user.email === 'string' ? user.email.toLowerCase().trim() : '';
      const cleanPhone = typeof user.phone === 'string' ? user.phone.trim() : '';

      if (cleanEmail && cleanPhone) {
        // High confidence match: both email and phone must strictly match the unlinked application
        details = await UserDetails.findOne({
          user_id: null,
          email: cleanEmail,
          phone: cleanPhone,
          deleteState: false,
        });
      }

      if (details) {
        details.user_id = user._id;
        await details.save();
      }
    }

    return NextResponse.json(details || {});
  } catch (error: any) {
    console.error('Profile GET Error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    // Sanitize input: only pick whitelisted fields (prevent Mass Assignment)
    const sanitizedUpdate: Record<string, any> = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (body[field] !== undefined) {
        sanitizedUpdate[field] = body[field];
      }
    }

    // Apply length and type sanitization
    if (typeof sanitizedUpdate.fullName === 'string') {
      sanitizedUpdate.fullName = sanitizedUpdate.fullName.trim().slice(0, 100);
    }
    if (typeof sanitizedUpdate.phone === 'string') {
      sanitizedUpdate.phone = sanitizedUpdate.phone.trim().slice(0, 30);
    }
    if (typeof sanitizedUpdate.email === 'string') {
      sanitizedUpdate.email = sanitizedUpdate.email.toLowerCase().trim().slice(0, 100);
    }
    if (typeof sanitizedUpdate.city === 'string') {
      sanitizedUpdate.city = sanitizedUpdate.city.trim().slice(0, 50);
    }
    if (typeof sanitizedUpdate.District === 'string') {
      sanitizedUpdate.District = sanitizedUpdate.District.trim().slice(0, 50);
    }
    if (typeof sanitizedUpdate.nationality === 'string') {
      sanitizedUpdate.nationality = sanitizedUpdate.nationality.trim().slice(0, 50);
    }
    if (typeof sanitizedUpdate.interests === 'string') {
      sanitizedUpdate.interests = sanitizedUpdate.interests.trim().slice(0, 500);
    }
    if (typeof sanitizedUpdate.specialization === 'string') {
      sanitizedUpdate.specialization = sanitizedUpdate.specialization.trim().slice(0, 100);
    }
    if (typeof sanitizedUpdate.classes === 'string') {
      sanitizedUpdate.classes = sanitizedUpdate.classes.trim().slice(0, 50);
    }
    if (typeof sanitizedUpdate.work === 'string') {
      sanitizedUpdate.work = sanitizedUpdate.work.trim().slice(0, 100);
    }
    if (Array.isArray(sanitizedUpdate.requiredCourses)) {
      sanitizedUpdate.requiredCourses = sanitizedUpdate.requiredCourses
        .slice(0, 20)
        .filter((c: any) => typeof c === 'string')
        .map((c: string) => c.slice(0, 100));
    }
    if (sanitizedUpdate.births !== undefined) {
      const b = Number(sanitizedUpdate.births);
      sanitizedUpdate.births = b >= 1940 && b <= 2026 ? b : 2000;
    }

    // Always enforce ownership via authenticated user_id
    sanitizedUpdate.user_id = user._id;
    sanitizedUpdate.deleteState = false;

    const updated = await UserDetails.findOneAndUpdate(
      { user_id: user._id },
      { $set: sanitizedUpdate },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: updated,
    });
  } catch (error: any) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء تحديث الملف الشخصي' }, { status: 500 });
  }
}
