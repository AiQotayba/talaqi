import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Organization, { OrgType } from '@/models/Organization';
import { getAuthUser } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const VALID_ORG_TYPES: OrgType[] = ['ngo', 'institute', 'university', 'company', 'governmental', 'initiative'];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Security: Only return verified and non-deleted organizations for public view
    const organizations = await Organization.find({
      deleteState: { $ne: true },
      isVerified: true,
    })
      .select('-__v')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('GET /api/centers error:', error);
    return NextResponse.json({ message: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح: يجب تسجيل الدخول لتقديم طلب تسجيل جهة تدريبية' },
        { status: 401 }
      );
    }

    // 2. Rate Limiting per user / IP: 10 requests per hour
    const clientIp = getClientIp(req);
    const rateLimitKey = `center-create:${user._id}:${clientIp}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000);
    if (!rateLimitCheck.success) {
      return rateLimitResponse(rateLimitCheck, 'تم تجاوز الحد المسموح من طلبات إنشاء الجهات التدريبية.');
    }

    const body = await req.json();
    await connectToDatabase();

    // 3. Validate Required Fields
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length < 2 || name.length > 200) {
      return NextResponse.json(
        { success: false, message: 'اسم الجهة التدريبية مطلوب ويجب أن يكون بين حرفين و 200 حرف' },
        { status: 400 }
      );
    }

    const orgType: OrgType = VALID_ORG_TYPES.includes(body.orgType) ? body.orgType : 'ngo';
    const legalName = typeof body.legalName === 'string' ? body.legalName.trim().slice(0, 200) : '';
    const logo = typeof body.logo === 'string' ? body.logo.trim().slice(0, 1000) : '';
    const coverImage = typeof body.coverImage === 'string' ? body.coverImage.trim().slice(0, 1000) : '';
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '';
    const website = typeof body.website === 'string' ? body.website.trim().slice(0, 500) : '';
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim().slice(0, 150) : '';
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim().slice(0, 50) : '';

    const socialMedia = {
      facebook: typeof body.socialMedia?.facebook === 'string' ? body.socialMedia.facebook.trim().slice(0, 500) : '',
      instagram: typeof body.socialMedia?.instagram === 'string' ? body.socialMedia.instagram.trim().slice(0, 500) : '',
      linkedin: typeof body.socialMedia?.linkedin === 'string' ? body.socialMedia.linkedin.trim().slice(0, 500) : '',
      whatsapp: typeof body.socialMedia?.whatsapp === 'string' ? body.socialMedia.whatsapp.trim().slice(0, 50) : '',
    };

    const address = {
      country: 'سوريا',
      city: typeof body.address?.city === 'string' && body.address.city.trim() ? body.address.city.trim().slice(0, 100) : 'إدلب',
      district: typeof body.address?.district === 'string' ? body.address.district.trim().slice(0, 100) : '',
      street: typeof body.address?.street === 'string' ? body.address.street.trim().slice(0, 200) : '',
    };

    // 4. Role & Verification Enforcement:
    // Only administrators can create an instantly verified organization.
    // For non-admin applicants, isVerified is ALWAYS false.
    const isAdmin = Array.isArray(user.roles) && user.roles.some((r: string) => ['admin', 'super_admin'].includes(r));
    const isVerified = isAdmin ? Boolean(body.isVerified ?? false) : false;
    const verifiedAt = isVerified ? new Date() : undefined;

    const sanitizedData = {
      name,
      legalName,
      orgType,
      logo,
      coverImage,
      description,
      website,
      contactEmail,
      contactPhone,
      socialMedia,
      address,
      isVerified,
      verifiedAt,
      deleteState: false,
    };

    const newOrg = await Organization.create(sanitizedData);

    return NextResponse.json(
      {
        success: true,
        message: isVerified
          ? 'تم إنشاء الجهة التدريبية بنجاح'
          : 'تم استلام طلب إضافة الجهة التدريبية بنجاح وهو قيد المراجعة والاعتماد',
        data: newOrg,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/centers error:', error);
    return NextResponse.json({ success: false, message: error.message || 'فشلت معالجة الطلب' }, { status: 400 });
  }
}
