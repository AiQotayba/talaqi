import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import UserDetails from '@/models/UserDetails';
import { authorizeAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdmin(req);
    if (!auth.authorized) return auth.response;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim();
    const roleFilter = searchParams.get('role')?.trim() || searchParams.get('roles')?.trim();
    const sortField = searchParams.get('sort_field') || 'createdAt';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 1 : -1;

    const conditions: any[] = [{ deleteState: { $ne: true } }];

    // Search filter across name, phone, email
    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      conditions.push({
        $or: [{ name: regex }, { phone: regex }, { email: regex }],
      });
    }

    // Role filter
    if (roleFilter && roleFilter !== 'all') {
      conditions.push({
        $or: [{ roles: roleFilter }, { role: roleFilter }],
      });
    }

    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    // Sort options
    const sortOption: any = {};
    if (sortField === 'id' || sortField === '_id') {
      sortOption._id = sortOrder;
    } else {
      sortOption[sortField] = sortOrder;
      if (sortField !== '_id') {
        sortOption._id = -1;
      }
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Lookup matching UserDetails for each user
    const userIds = users.map((u) => u._id);
    const phones = users.map((u) => u.phone).filter(Boolean);
    const emails = users.map((u) => u.email).filter(Boolean);

    const matchingDetails = await UserDetails.find({
      deleteState: { $ne: true },
      $or: [
        { user_id: { $in: userIds } },
        { phone: { $in: phones } },
        { email: { $in: emails } },
      ],
    }).lean();

    const enriched = users.map((u: any) => {
      const uPhoneClean = (u.phone || '').replace(/[^0-9]/g, '');
      const detail = matchingDetails.find((d: any) => {
        if (d.user_id && d.user_id.toString() === u._id.toString()) return true;
        if (d.email && u.email && d.email.toLowerCase() === u.email.toLowerCase()) return true;
        if (d.phone && u.phone) {
          const dPhoneClean = d.phone.replace(/[^0-9]/g, '');
          if (dPhoneClean && uPhoneClean && dPhoneClean === uPhoneClean) return true;
        }
        return false;
      });

      return {
        ...u,
        userDetail: detail || null,
      };
    });

    return NextResponse.json({
      isError: false,
      data: enriched,
      meta: {
        current_page: page,
        last_page: Math.ceil(total / limit) || 1,
        per_page: limit,
        total,
      },
    });
  } catch (error: any) {
    console.error('Admin Users GET Error:', error);
    return NextResponse.json(
      { isError: true, message: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
