import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ message: 'البريد الإلكتروني مسجل بالفعل' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    // Enforce student role on public signup - never trust role from request body
    const initialRoles: ('student')[] = ['student'];

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      roles: initialRoles,
    });

    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      roles: newUser.roles,
      role: 'user',
    });

    const response = NextResponse.json(
      {
        message: 'تم إنشاء الحساب بنجاح',
        isAdmin: false,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          roles: newUser.roles,
        },
      },
      { status: 201 }
    );

    response.cookies.set('authorization', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('isAdmin', 'false', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
}
