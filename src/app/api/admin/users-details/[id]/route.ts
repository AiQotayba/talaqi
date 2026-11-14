import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UserDetails from '@/models/UserDetails';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const data = await UserDetails.findById(id);
    if (!data) return NextResponse.json({ message: 'البيانات غير موجودة' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const data = await UserDetails.findByIdAndUpdate(id, body, { new: true });
    if (!data) return NextResponse.json({ message: 'البيانات غير موجودة' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: 'فشل في تحديث البيانات' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const data = await UserDetails.findByIdAndUpdate(id, { deleteState: true });
    if (!data) return NextResponse.json({ message: 'البيانات غير موجودة' }, { status: 404 });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
