import { NextRequest, NextResponse } from 'next/server';
import { extractCourseFromText } from '@/lib/gemini';
import { authorizeAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const MAX_TEXT_LENGTH = 15000;

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize Admin
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    // 2. Rate Limiting: 25 requests per 10 minutes
    const clientIp = getClientIp(req);
    const rateLimitKey = `ai-parse-text:${auth.user._id}:${clientIp}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey, 25, 10 * 60 * 1000);
    if (!rateLimitCheck.success) {
      return rateLimitResponse(rateLimitCheck, 'تم تجاوز الحد المسموح من طلبات معالجة النصوص الذكية.');
    }

    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال نص إعلان كافٍ للتحليل (10 أحرف على الأقل)' }, { status: 400 });
    }

    if (rawText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `النص المدخل طويل جداً (الحد الأقصى ${MAX_TEXT_LENGTH.toLocaleString()} حرف)` },
        { status: 400 }
      );
    }

    const data = await extractCourseFromText(rawText);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Gemini Parse Text Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء معالجة النص بواسطة الذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}
