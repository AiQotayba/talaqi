import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Section from '@/models/Section';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const section = await Section.findById(id);
    if (!section) return NextResponse.json({ message: 'القسم غير موجود' }, { status: 404 });
    return NextResponse.json(section);
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
    const updated = await Section.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ message: 'القسم غير موجود' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: 'فشل تحديث القسم' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();
    const section = await Section.findByIdAndUpdate(id, { deleteState: true }, { new: true });
    if (!section) return NextResponse.json({ message: 'القسم غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم حذف القسم بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
