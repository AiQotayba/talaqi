import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    // Public course endpoint must strictly enforce published status and non-deleted state
    const andConditions: any[] = [
      { deleteState: { $ne: true } },
      { status: 'published' },
    ];

    const rawSearch = searchParams.get('q')?.trim();
    if (rawSearch) {
      // Escape special regex characters to prevent ReDoS and regex injection attacks
      const escapedSearch = rawSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      andConditions.push({
        $or: [
          { title: searchRegex },
          { context: searchRegex },
          { 'providingEntity.name': searchRegex },
          { keys: { $in: [searchRegex] } },
        ],
      });
    }

    const rawCity = searchParams.get('city')?.trim();
    if (rawCity && rawCity !== 'all') {
      const escapedCity = rawCity.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const cityRegex = new RegExp(escapedCity, 'i');
      andConditions.push({
        $or: [
          { location: cityRegex },
          { 'locationDetails.city': cityRegex },
        ],
      });
    }

    const isOnline = searchParams.get('isOnline');
    if (isOnline !== null) {
      if (isOnline === 'true') {
        andConditions.push({ locationType: 'online' });
      } else if (isOnline === 'false') {
        andConditions.push({ locationType: { $in: ['in_person', 'hybrid'] } });
      }
    }

    const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Fetch Courses Error:', error);
    return NextResponse.json({ message: error.message || 'فشل جلب الدورات' }, { status: 500 });
  }
}
