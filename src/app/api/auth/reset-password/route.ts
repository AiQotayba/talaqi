import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import waSend from '@/lib/wa';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

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

    // إنشاء رمز إعادة التعيين وصلاحية لمدة ساعة
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // تكوين رابط إعادة التعيين
    const origin =
      req.headers.get('origin') ||
      req.headers.get('x-forwarded-host') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3002';
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`;
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
