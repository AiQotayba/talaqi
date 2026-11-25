import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import waSend from '@/lib/wa';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getTrustedBaseUrl } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Rate Limiting by IP: 10 requests per 15 minutes
    const ipLimitCheck = checkRateLimit(`reset-pwd-ip:${clientIp}`, 10, 15 * 60 * 1000);
    if (!ipLimitCheck.success) {
      return rateLimitResponse(ipLimitCheck, 'تم تجاوز الحد المسموح من طلبات استعادة كلمة المرور.');
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.length > 150) {
      return NextResponse.json(
        { success: false, message: 'صيغة البريد الإلكتروني غير صالحة' },
        { status: 400 }
      );
    }

    // 2. Rate Limiting by Email: 3 requests per 15 minutes
    const emailLimitCheck = checkRateLimit(`reset-pwd-email:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!emailLimitCheck.success) {
      return rateLimitResponse(emailLimitCheck, 'تم إرسال عدة طلبات لهذا البريد مؤخراً. يرجى الانتظار قبل المحاولة مرة أخرى.');
    }

    await connectToDatabase();
    const user = await User.findOne({
      email: normalizedEmail,
      deleteState: false,
    });

    // Security: Return uniform generic response whether the email exists or not to prevent account enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.',
      });
    }

    // إنشاء رمز إعادة التعيين وتخزين هاش مشفر منه (OWASP ASVS 2.5.6)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // تخزين الهاش فقط في قاعدة البيانات لحماية المستخدمين في حال تسرب البيانات
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Security: Build reset URL strictly from trusted server domain configuration.
    // NEVER rely on client-supplied Host, Origin, or X-Forwarded-Host headers (prevents Host Header Injection / Reset Poisoning).
    const baseUrl = getTrustedBaseUrl();
    const resetUrl = `${baseUrl}/auth?route=newPassword&token=${resetToken}`;

    // Security: Do NOT log sensitive reset tokens or URLs in production logs
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH] Reset Password requested for: ${user.email}`);
    }

    // إرسال عبر الواتساب في حال توفر رقم هاتف للمستخدم وخدمة الواتساب
    if (user.phone) {
      try {
        await waSend(
          user.phone,
          `مرحباً ${user.name}،\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة تلاقي.\nيمكنك تعيين كلمة مرور جديدة من خلال الرابط التالي:\n${resetUrl}\nصلاحية هذا الرابط ساعة واحدة فقط.`
        );
      } catch (waErr) {
        console.warn('[AUTH] WhatsApp send failed:', waErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.',
    });
  } catch (error: any) {
    console.error('[AUTH] Reset Password Error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
