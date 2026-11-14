import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Slider from '@/models/Slider';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    await connectToDatabase();
    const sliders = await Slider.find({ deleteState: { $ne: true } }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(sliders);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    await connectToDatabase();

    if (!body.title || !body.image) {
      return NextResponse.json({ message: 'العنوان والصورة مطلوبان' }, { status: 400 });
    }

    const newSlider = await Slider.create(body);
    return NextResponse.json(newSlider, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
