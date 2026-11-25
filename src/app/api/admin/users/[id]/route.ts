import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import UserDetails from '@/models/UserDetails';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    await connectToDatabase();
    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    if (!user) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });

    const uPhoneClean = (user.phone || '').replace(/[^0-9]/g, '');
    const userDetail = await UserDetails.findOne({
      deleteState: { $ne: true },
      $or: [
        { user_id: user._id },
        { email: user.email },
        { phone: user.phone },
      ],
    }).lean();

    return NextResponse.json({
      isError: false,
      data: {
        ...user,
        userDetail: userDetail || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(id, { deleteState: true });
    if (!user) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
