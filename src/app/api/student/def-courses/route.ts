import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DefCourse from '@/models/DefCourse';
import { authorizeAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Security: Only authorized admins can read draft courses
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    await connectToDatabase();
    const data = await DefCourse.find({ deleteState: { $ne: true } }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('DefCourse GET Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Rate Limiting: 6 draft submissions per 15 minutes per IP/fingerprint
    const rateLimitKey = `def-course-post:${clientIp}:${userAgent.slice(0, 50)}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey, 6, 15 * 60 * 1000);
    if (!rateLimitCheck.success) {
      return rateLimitResponse(rateLimitCheck, 'تم تجاوز الحد المسموح به من مقترحات ومسودات الدورات. يرجى المحاولة لاحقاً.');
    }

    const body = await req.json();

    // 2. Validate inputs
    const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
    const rawContext = typeof body.context === 'string' ? body.context.trim() : (typeof body.rawText === 'string' ? body.rawText.trim() : '');

    if (!rawTitle && !rawContext) {
      return NextResponse.json(
        { success: false, message: 'يرجى تقديم عنوان أو نص تفصيلي للمسودة التدريبية' },
        { status: 400 }
      );
    }

    const title = rawTitle.slice(0, 200);
    const context = rawContext.slice(0, 15000);
    const rawText = (typeof body.rawText === 'string' ? body.rawText.trim() : rawContext).slice(0, 15000);
    const image = typeof body.image === 'string' ? body.image.trim().slice(0, 1000) : '';
    const Source = typeof body.Source === 'string' ? body.Source.trim().slice(0, 500) : (typeof body.sourceUrl === 'string' ? body.sourceUrl.trim().slice(0, 500) : '');
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 150) : '';
    const organizationName = typeof body.organizationName === 'string' ? body.organizationName.trim().slice(0, 150) : '';

    await connectToDatabase();

    const newDefCourse = await DefCourse.create({
      title,
      context,
      rawText,
      image,
      Source,
      location,
      organizationName,
      deleteState: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم إرسال مسودة التدريب بنجاح، ستتم مراجعتها من قِبل إدارة المنصة.',
        data: newDefCourse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('DefCourse POST Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'فشلت معالجة الطلب' },
      { status: 400 }
    );
  }
}
