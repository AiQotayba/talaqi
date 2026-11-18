"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { DataTable, type TableColumn } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserDetailRecord {
  _id: string;
  fullName: string;
  phone: string;
  District?: string;
  city?: string;
  interests?: string;
  educationLevel?: string;
  specialization?: string;
  freeCourses?: boolean;
  paidCourses?: boolean;
  paidCoursesLimit?: number;
  requiredCourses?: string[];
  createdAt?: string;
}

export default function AdminUsersDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDateFilter = searchParams?.get("date_filter") || "all";

  const handleDateFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value === "all") {
      params.delete("date_filter");
    } else {
      params.set("date_filter", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleView = (student: UserDetailRecord) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("userId", student._id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formatCleanPhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("00")) clean = clean.substring(2);
    if (clean.startsWith("09")) clean = "963" + clean.substring(1);
    return clean;
  };

  // Simplified columns: Education & Specialization removed as requested
  const columns: TableColumn<UserDetailRecord>[] = [
    {
      key: "fullName",
      label: "اسم الطالب",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-[#123D3A]/10 text-[#123D3A] flex items-center justify-center font-bold text-sm shrink-0">
            {row.fullName?.charAt(0) || "ط"}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              onClick={() => handleView(row)}
              className="font-bold text-slate-900 hover:text-[#123D3A] cursor-pointer transition truncate max-w-[200px]"
            >
              {row.fullName || "طالب بدون اسم"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
              {row.phone || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "رقم الهاتف والواتساب",
      sortable: false,
      render: (val) => {
        const clean = formatCleanPhone(String(val || ""));
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-700" dir="ltr">
              {String(val || "—")}
            </span>
            {clean && (
              <a
                href={`https://wa.me/${clean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                title="مراسلة عبر واتساب"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
              </a>
            )}
          </div>
        );
      },
    },
    {
      key: "location",
      label: "المنطقة والمدينة",
      render: (_, row) => {
        const loc = [row.District || "إدلب", row.city].filter(Boolean).join(" - ");
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[160px] font-medium">{loc || "إدلب"}</span>
          </div>
        );
      },
    },
    {
      key: "interests",
      label: "الاهتمام التدريبي المطلوب",
      render: (val) => (
        <div className="max-w-[240px] truncate">
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D58A38]/10 text-[#A06018] truncate max-w-full">
            {String(val || "عام / غير محدد")}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الطلب",
      sortable: true,
      render: (val) => {
        if (!val) return <span className="text-xs text-slate-400">—</span>;
        const date = new Date(val);
        const formatted = date.toLocaleDateString("ar-SY", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formatted}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#123D3A] text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              طلبات واهتمامات الطلاب التدريبية
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              قائمة الطلاب المسجلين لتوجيههم ومطابقة رغباتهم مع التدريبات المتاحة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/send-training"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>إرسال تدريب للطلاب (واتساب) 🚀</span>
          </Link>
        </div>
      </div>

      {/* Unified Box for Table and Search/Date Filter */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        {/* Main DataTable with Date Filter as extra header action */}
        <DataTable<UserDetailRecord>
          columns={columns}
          apiEndpoint="admin/users-details"
          searchPlaceholder="ابحث باسم الطالب، الهاتف، المدينة، أو الرغبة..."
          emptyMessage="لم يتم العثور على أي طلبات طلابية مطابقة للبحث أو التصفية"
          enableDelete={true}
          enableEdit={false}
          enableView={true}
          deleteTitle="حذف طلب الطالب"
          deleteDescription={(row) =>
            `هل أنت متأكد من حذف استمارة الطالب "${row.fullName}"؟ سيتم حذف بيانات الاتصال نهائياً.`
          }
          extraHeaderActions={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                فلتر التاريخ:
              </span>
              <Select value={currentDateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[140px] h-9 text-xs font-bold bg-white rounded-xl border-slate-200">
                  <SelectValue placeholder="تصفية بالتاريخ" />
                </SelectTrigger>
                <SelectContent className="text-right">
                  <SelectItem value="all">كل التواريخ</SelectItem>
                  <SelectItem value="today">طلبات اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="30days">آخر 30 يوماً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          actions={{
            onView: handleView,
          }}
        />
      </div>
    </div>
  );
}