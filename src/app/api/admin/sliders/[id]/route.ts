import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Slider from '@/models/Slider';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const slider = await Slider.findById(id);
    if (!slider) return NextResponse.json({ message: 'السلايدر غير موجود' }, { status: 404 });
    return NextResponse.json(slider);
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
    const updated = await Slider.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ message: 'السلايدر غير موجود' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: 'فشل في تحديث السلايدر' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const slider = await Slider.findByIdAndUpdate(id, { deleteState: true }, { new: true });
    if (!slider) return NextResponse.json({ message: 'السلايدر غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم حذف السلايدر بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
