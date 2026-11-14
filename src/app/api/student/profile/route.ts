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
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    await connectToDatabase();
    // Strictly find profile by authenticated user_id
    let details = await UserDetails.findOne({
      user_id: user._id,
      deleteState: false,
    });

    // One-time fallback migration: if no record by user_id yet, link unlinked record matching email or phone
    if (!details) {
      details = await UserDetails.findOne({
        user_id: null,
        $or: [{ email: user.email }, { phone: user.phone }],
        deleteState: false,
      });

      if (details) {
        details.user_id = user._id;
        await details.save();
      }
    }

    return NextResponse.json(details || {});
  } catch (error: any) {
    console.error('Profile GET Error:', error);
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
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

    // Always enforce ownership via authenticated user_id
    sanitizedUpdate.user_id = user._id;
    sanitizedUpdate.deleteState = false;

    // Validate email if present
    if (sanitizedUpdate.email && typeof sanitizedUpdate.email === 'string') {
      sanitizedUpdate.email = sanitizedUpdate.email.toLowerCase().trim();
    }

    const updated = await UserDetails.findOneAndUpdate(
      { user_id: user._id },
      { $set: sanitizedUpdate },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'تم تحديث الملف الشخصي بنجاح', data: updated });
  } catch (error: any) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء تحديث الملف الشخصي' }, { status: 500 });
  }
}
