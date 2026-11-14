import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Section from '@/models/Section';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    await connectToDatabase();
    const sections = await Section.find({ deleteState: { $ne: true } }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(sections);
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

    if (!body.name) {
      return NextResponse.json({ message: 'اسم القسم مطلوب' }, { status: 400 });
    }

    if (!body.slug) {
      body.slug = body.name.toLowerCase().trim().replace(/\s+/g, '-');
    }

    const newSection = await Section.create(body);
    return NextResponse.json(newSection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
