import { NextRequest, NextResponse } from 'next/server';
import { extractCourseFromImage } from '@/lib/gemini';
import { authorizeAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { isValidImageSignature } from '@/lib/security';

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize Admin
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    // 2. Rate Limiting: 20 requests per 10 minutes
    const clientIp = getClientIp(req);
    const rateLimitKey = `ai-parse-image:${auth.user._id}:${clientIp}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey, 20, 10 * 60 * 1000);
    if (!rateLimitCheck.success) {
      return rateLimitResponse(rateLimitCheck, 'تم تجاوز الحد المسموح من طلبات معالجة الصور الذكية.');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const notesRaw = formData.get('notes');
    const additionalNotes = typeof notesRaw === 'string' ? notesRaw.slice(0, 2000) : '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'يرجى إرفاق صورة البوستر الإعلاني' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'حجم صورة البوستر يتجاوز الحد الأقصى المسموح به (5 ميغابايت)' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. الصيغ المدعومة هي: JPEG, PNG, WebP فقط' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { success: false, error: 'توقيع الملف غير صالح أو تالف. يرجى رفع ملف صورة حقيقي' },
        { status: 400 }
      );
    }

    const data = await extractCourseFromImage(buffer, mimeType, additionalNotes);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Gemini Parse Image Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء معالجة صورة البوستر بواسطة الذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}
