import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'الدورة غير موجودة' }, { status: 404 });
    }

    await connectToDatabase();
    const course = await Course.findOne({
      _id: id,
      status: 'published',
      deleteState: { $ne: true },
    }).lean();

    if (!course) {
      return NextResponse.json({ message: 'الدورة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Course details API error:', error);
    return NextResponse.json({ message: 'خطأ في جلب بيانات الدورة' }, { status: 500 });
  }
}
