import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Organization from "@/models/Organization";
import Course from "@/models/Course";
import { authorizeAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: any = { deleteState: { $ne: true } };
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { legalName: { $regex: search.trim(), $options: "i" } },
        { "address.city": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const organizations = await Organization.find(query)
      .sort({ isVerified: -1, createdAt: -1 })
      .lean();

    // Map course count for each center
    const withCounts = await Promise.all(
      organizations.map(async (org: any) => {
        const count = await Course.countDocuments({
          $or: [
            { "providingEntity.organizationId": org._id },
            { "providingEntity.name": org.name },
            { center: org.name },
          ],
          deleteState: { $ne: true },
        });
        return { ...org, courseCount: count };
      })
    );

    return NextResponse.json({ success: true, data: withCounts });
  } catch (error: any) {
    console.error("GET /api/admin/centers error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    await connectToDatabase();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "اسم المركز أو المنظمة مطلوب" }, { status: 400 });
    }

    const newOrg = await Organization.create({
      name: body.name.trim(),
      legalName: body.legalName?.trim() || "",
      orgType: body.orgType || "ngo",
      logo: body.logo?.trim() || "",
      coverImage: body.coverImage?.trim() || "",
      description: body.description?.trim() || "",
      website: body.website?.trim() || "",
      contactEmail: body.contactEmail?.trim() || "",
      contactPhone: body.contactPhone?.trim() || "",
      socialMedia: {
        facebook: body.socialMedia?.facebook?.trim() || "",
        instagram: body.socialMedia?.instagram?.trim() || "",
        linkedin: body.socialMedia?.linkedin?.trim() || "",
        whatsapp: body.socialMedia?.whatsapp?.trim() || "",
      },
      address: {
        country: "سوريا",
        city: body.address?.city?.trim() || "إدلب",
        district: body.address?.district?.trim() || "",
        street: body.address?.street?.trim() || "",
      },
      isVerified: Boolean(body.isVerified ?? true),
      verifiedAt: body.isVerified ? new Date() : undefined,
      deleteState: false,
    });

    return NextResponse.json({ success: true, data: newOrg }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/centers error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
