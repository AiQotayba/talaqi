import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Organization from "@/models/Organization";
import { authorizeAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();

    const org = await Organization.findById(id).lean();
    if (!org || org.deleteState) {
      return NextResponse.json({ success: false, message: "المركز غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const updated = await Organization.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name?.trim(),
          legalName: body.legalName?.trim(),
          orgType: body.orgType,
          logo: body.logo?.trim(),
          coverImage: body.coverImage?.trim(),
          description: body.description?.trim(),
          website: body.website?.trim(),
          contactEmail: body.contactEmail?.trim(),
          contactPhone: body.contactPhone?.trim(),
          "socialMedia.facebook": body.socialMedia?.facebook?.trim(),
          "socialMedia.instagram": body.socialMedia?.instagram?.trim(),
          "socialMedia.linkedin": body.socialMedia?.linkedin?.trim(),
          "socialMedia.whatsapp": body.socialMedia?.whatsapp?.trim(),
          "address.city": body.address?.city?.trim(),
          "address.district": body.address?.district?.trim(),
          "address.street": body.address?.street?.trim(),
          isVerified: Boolean(body.isVerified),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "المركز غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await connectToDatabase();

    const deleted = await Organization.findByIdAndUpdate(
      id,
      { deleteState: true },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ success: false, message: "المركز غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم حذف المركز بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
