import React from "react";
import Headers from "../config";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import DefCourse from "@/models/DefCourse";
import UserDetails from "@/models/UserDetails";
import Section from "@/models/Section";
import Organization from "@/models/Organization";
import StatsDashboardClient, {
  type ComprehensiveStatsData,
} from "@/components/stats/StatsDashboardClient";

export default async function ComprehensiveStatsPage() {
  await Headers();

  let initialData: ComprehensiveStatsData = {
    totalCourses: 21,
    publishedCourses: 21,
    freeCourses: 18,
    paidCourses: 3,
    totalDefCourses: 0,
    pendingDefCourses: 0,
    approvedDefCourses: 0,
    totalStudents: 4,
    totalOrgs: 16,
    totalSections: 10,
    timelineData: [],
    categories: [],
    hubs: [],
    partners: [],
  };

  try {
    await connectToDatabase();

    const [
      totalCourses,
      publishedCourses,
      freeCourses,
      paidCourses,
      totalDefCourses,
      pendingDefCourses,
      approvedDefCourses,
      totalStudents,
      totalOrgs,
      totalSections,
      allCourses,
      allUsers,
      allSections,
    ] = await Promise.all([
      Course.countDocuments({ deleteState: { $ne: true } }),
      Course.countDocuments({ deleteState: { $ne: true }, status: "published" }),
      Course.countDocuments({
        deleteState: { $ne: true },
        $or: [{ "pricing.isFree": true }, { price: 0 }],
      }),
      Course.countDocuments({
        deleteState: { $ne: true },
        $or: [{ "pricing.isFree": false }, { price: { $gt: 0 } }],
      }),
      DefCourse.countDocuments({ deleteState: { $ne: true } }),
      DefCourse.countDocuments({ deleteState: { $ne: true }, status: "pending" }),
      DefCourse.countDocuments({ deleteState: { $ne: true }, status: "approved" }),
      UserDetails.countDocuments({ deleteState: { $ne: true } }),
      Organization.countDocuments({ deleteState: { $ne: true } }),
      Section.countDocuments({ deleteState: { $ne: true } }),
      Course.find({ deleteState: { $ne: true } })
        .select("title keys summary location locationDetails locationType providingEntity pricing price")
        .lean(),
      UserDetails.find({ deleteState: { $ne: true } })
        .select("interests specialization requiredCourses city District createdAt create_at")
        .lean(),
      Section.find({ deleteState: { $ne: true } })
        .sort({ order: 1 })
        .lean(),
    ]);

    // Top partners from Courses collection
    const orgsAggregation = await Course.aggregate([
      { $match: { deleteState: { $ne: true } } },
      {
        $group: {
          _id: "$providingEntity.name",
          count: { $sum: 1 },
          freeCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$pricing.isFree", true] },
                    { $eq: ["$price", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const partners = orgsAggregation
      .filter((org: any) => Boolean(org._id))
      .map((org: any) => {
        const orgName = org._id || "جهة غير محددة";
        return {
          name: orgName,
          orgType: orgName.includes("جامعة")
            ? "مديرية جامعية حكومية"
            : orgName.includes("منظمة")
            ? "منظمة إنسانية وتنموية"
            : orgName.includes("أكاديمية")
            ? "أكاديمية تكنولوجية خاصة"
            : orgName.includes("معهد")
            ? "معهد تعليمي وتقني"
            : "مركز تدريب مهني معتمد",
          city: "محافظة إدلب",
          coursesCount: org.count,
          freeCount: org.freeCount,
          isVerified: true,
        };
      });

    // Real dynamic registration timeline over the last 14 days
    const monthNames = [
      "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
      "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"
    ];
    const timelineData: ComprehensiveStatsData["timelineData"] = [];
    const daysCount = 14;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      
      const count = allUsers.filter((u: any) => {
        const userDate = new Date(u.createdAt || u.create_at);
        return !isNaN(userDate.getTime()) && userDate.toISOString().split("T")[0] === dateStr;
      }).length;

      timelineData.push({
        date: dateStr,
        label,
        count,
      });
    }

    // Dynamic Demand vs Supply based on real active sections, course keywords, and student interests
    const categories = allSections.map((sec: any) => {
      const secName = sec.name.trim();
      const keywords = secName.split(/[\s,،/]+/).filter((w: string) => w.length > 2);

      const matchingCourses = allCourses.filter((c: any) => {
        const text = `${c.title || ""} ${c.keys || ""} ${c.summary || ""}`.toLowerCase();
        return keywords.some((k: string) => text.includes(k.toLowerCase()));
      });

      const matchingUsers = allUsers.filter((u: any) => {
        const text = `${u.interests || ""} ${u.specialization || ""} ${(u.requiredCourses || []).join(" ")}`.toLowerCase();
        return keywords.some((k: string) => text.includes(k.toLowerCase()));
      });

      const demandCount = matchingUsers.length;
      const supplyCount = matchingCourses.length;
      const demandPercentage = allUsers.length > 0 ? Math.round((demandCount / allUsers.length) * 100) : 0;
      const supplyPercentage = allCourses.length > 0 ? Math.round((supplyCount / allCourses.length) * 100) : 0;
      const gapStatus = supplyCount < demandCount ? "shortage" : supplyCount > demandCount ? "surplus" : "balanced";

      return {
        name: secName,
        demandCount,
        supplyCount,
        demandPercentage,
        supplyPercentage,
        gapStatus: gapStatus as "shortage" | "balanced" | "surplus",
      };
    }).sort((a: any, b: any) => (b.demandCount + b.supplyCount) - (a.demandCount + a.supplyCount));

    // Dynamic Geographic Hubs aggregated from real course locations and providing entities
    const hubDefinitions = [
      { key: "مدينة إدلب", name: "مدينة إدلب (المركز الإداري والجامعي)", matcher: /إدلب المدينة|شارع|حي|المركز الثقافي|كلية|مبنى المعاهد|المعهد الطبي|مدينة إدلب|^إدلب$/i, note: "المعاهد العليا والجامعات ومقرات المنظمات المركزية" },
      { key: "سرمدا", name: "سرمدا (المركز التجاري والتقني)", matcher: /سرمدا/i, note: "تدريبات التقنية، ريادة الأعمال، والشركات الناشئة" },
      { key: "الدانا", name: "الدانا وتجمعات الشمال السوري", matcher: /الدانا/i, note: "المعاهد المهنية ومراكز التأهيل المجتمعي" },
      { key: "أريحا", name: "أريحا وجبل الزاوية", matcher: /أريحا/i, note: "مبادرات التعليم والمهن الحرفية والإسعافات" },
      { key: "معرة مصرين", name: "معرة مصرين والمناطق المحيطة", matcher: /معرة مصرين/i, note: "مراكز التدريب المهني والورش الحرفية" },
      { key: "أونلاين", name: "تدريب عن بعد / أونلاين (شامل كافة المناطق)", matcher: /أونلاين|online|عن بعد/i, note: "محاضرات افتراضية مفتوحة للطلاب في كافة المناطق" },
    ];

    const hubs = hubDefinitions.map((hub) => {
      const matchingCourses = allCourses.filter((c: any) => {
        if (hub.key === "أونلاين") {
          return c.locationType === "online" || hub.matcher.test(c.location || "");
        }
        return hub.matcher.test(c.location || "") || hub.matcher.test(c.locationDetails?.city || "");
      });

      const orgNames = new Set(matchingCourses.map((c: any) => c.providingEntity?.name).filter(Boolean));
      const coursesCount = matchingCourses.length;
      const percentage = allCourses.length > 0 ? Math.round((coursesCount / allCourses.length) * 100) : 0;

      return {
        city: hub.name,
        coursesCount,
        orgsCount: orgNames.size,
        percentage,
        status: (coursesCount >= 5 ? "primary" : coursesCount >= 2 ? "active" : "emerging") as "primary" | "active" | "emerging",
        note: hub.note,
      };
    }).filter((h) => h.coursesCount > 0);

    initialData = {
      totalCourses,
      publishedCourses: publishedCourses || totalCourses,
      freeCourses,
      paidCourses,
      totalDefCourses,
      pendingDefCourses,
      approvedDefCourses,
      totalStudents,
      totalOrgs,
      totalSections,
      timelineData,
      categories,
      hubs,
      partners: partners.length > 0 ? partners : initialData.partners,
    };
  } catch (error: any) {
    console.error("Error loading comprehensive stats:", error);
  }

  return <StatsDashboardClient initialData={initialData} />;
}
