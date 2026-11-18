"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users,
  Shield,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  GraduationCap,
  MapPin,
  BookOpen,
  DollarSign,
  Languages,
  Laptop,
  AlertCircle,
  Eye,
  ExternalLink,
} from "lucide-react";
import { DataTable, type TableColumn } from "@/components/table/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roles?: string[];
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userDetail?: {
    _id: string;
    fullName?: string;
    phone?: string;
    email?: string;
    District?: string;
    city?: string;
    interests?: string;
    educationLevel?: string;
    specialization?: string;
    classes?: string;
    englishLevel?: string;
    computerUsage?: string;
    freeCourses?: boolean;
    paidCourses?: boolean;
    paidCoursesLimit?: number;
    requiredCourses?: string[];
    work?: string;
    create_at?: string;
    createdAt?: string;
  } | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRoleFilter = searchParams?.get("role") || "all";
  const [selectedUser, setSelectedUser] = React.useState<UserRecord | null>(null);

  const handleRoleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value === "all") {
      params.delete("role");
    } else {
      params.set("role", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formatCleanPhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("00")) clean = clean.substring(2);
    if (clean.startsWith("09")) clean = "963" + clean.substring(1);
    return clean;
  };

  const getRoleBadge = (roles?: string[], role?: string) => {
    const allRoles = roles && roles.length > 0 ? roles : (role ? [role] : ["student"]);
    if (allRoles.includes("super_admin")) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
          مسؤول رئيسي
        </span>
      );
    }
    if (allRoles.includes("admin")) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          مسؤول (Admin)
        </span>
      );
    }
    if (allRoles.includes("center_admin")) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          مدير مركز
        </span>
      );
    }
    if (allRoles.includes("publisher")) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          ناشر إعلانات
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
        طالب (Student)
      </span>
    );
  };

  const columns: TableColumn<UserRecord>[] = [
    {
      key: "name",
      label: "اسم المستخدم",
      sortable: true,
      render: (_, row) => {
        const userRoles = row.roles || (row.role ? [row.role] : ["student"]);
        const isAdmin = userRoles.includes("admin") || userRoles.includes("super_admin");
        return (
          <div className="flex items-center gap-3 py-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                isAdmin ? "bg-amber-100 text-amber-800" : "bg-[#123D3A]/10 text-[#123D3A]"
              }`}
            >
              {isAdmin ? <Shield className="w-4 h-4 text-amber-700" /> : row.name?.charAt(0) || "م"}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                onClick={() => setSelectedUser(row)}
                className="font-bold text-slate-900 hover:text-[#123D3A] cursor-pointer transition truncate max-w-[180px]"
                title="انقر لعرض الملف الشخصي وسجل الطالب"
              >
                {row.name || "مستخدم بدون اسم"}
              </span>
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]" dir="ltr">
                {row.email || "—"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      label: "البريد الإلكتروني",
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono" dir="ltr">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">{String(val || "—")}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "الهاتف وواتساب",
      sortable: true,
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
      key: "role",
      label: "الدور / الصلاحية",
      sortable: true,
      render: (_, row) => getRoleBadge(row.roles, row.role),
    },
    {
      key: "userDetail",
      label: "الملف التدريبي (UserDetailRecord)",
      render: (_, row) => {
        if (!row.userDetail) {
          return (
            <span className="text-[11px] text-slate-400 font-normal">
              لم تُسجل استمارة
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => setSelectedUser(row)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123D3A] bg-[#123D3A]/10 hover:bg-[#123D3A]/20 px-2 py-0.5 rounded-lg transition"
            title="عرض استمارة اهتمامات الطالب"
          >
            <GraduationCap className="w-3 h-3 text-[#123D3A]" />
            <span className="truncate max-w-[140px]">
              {row.userDetail.interests || row.userDetail.District || "مسجل اهتماماته ✓"}
            </span>
          </button>
        );
      },
    },
    {
      key: "createdAt",
      label: "تاريخ التسجيل",
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
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              إدارة المستخدمين والمسؤولين
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              قائمة الحسابات المسجلة مع إمكانية استعراض سجل الطالب وسجل الاهتمامات (UserDetailRecord)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/users-details"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#123D3A] bg-[#123D3A]/10 hover:bg-[#123D3A]/20 transition"
          >
            <GraduationCap className="w-4 h-4" />
            <span>طلبات واهتمامات الطلاب</span>
          </Link>
        </div>
      </div>

      {/* Main Table Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        <DataTable<UserRecord>
          columns={columns}
          apiEndpoint="admin/users"
          searchPlaceholder="ابحث باسم المستخدم، رقم الهاتف، أو البريد الإلكتروني..."
          emptyMessage="لم يتم العثور على أي مستخدمين مطابقين للبحث أو التصفية"
          enableDelete={true}
          enableEdit={false}
          enableView={true}
          deleteTitle="حذف حساب المستخدم"
          deleteDescription={(row) =>
            `هل أنت متأكد من حذف حساب "${row.name}"؟ سيتم حذف الحساب نهائياً.`
          }
          extraHeaderActions={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                تصفية بالدور:
              </span>
              <Select value={currentRoleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-[150px] h-9 text-xs font-bold bg-white rounded-xl border-slate-200">
                  <SelectValue placeholder="كل الأدوار" />
                </SelectTrigger>
                <SelectContent className="text-right">
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="student">طالب (Student)</SelectItem>
                  <SelectItem value="admin">مسؤول (Admin)</SelectItem>
                  <SelectItem value="center_admin">مدير مركز</SelectItem>
                  <SelectItem value="publisher">ناشر إعلانات</SelectItem>
                  <SelectItem value="super_admin">مسؤول رئيسي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          actions={{
            onView: (user) => setSelectedUser(user),
          }}
        />
      </div>

      {/* Profile Dialog displaying complete UserDetailRecord */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <div className="space-y-4">
              <DialogHeader className="text-right pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#123D3A]/10 text-[#123D3A] flex items-center justify-center font-black text-lg">
                      {selectedUser.name?.charAt(0) || "م"}
                    </div>
                    <div>
                      <DialogTitle className="text-base sm:text-lg font-black text-slate-900">
                        {selectedUser.name}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getRoleBadge(selectedUser.roles, selectedUser.role)}
                        {selectedUser.createdAt && (
                          <span className="text-[11px] text-slate-400">
                            عضو منذ: {new Date(selectedUser.createdAt).toLocaleDateString("ar-SY")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/users/${selectedUser._id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="فتح الصفحة الكاملة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </DialogHeader>

              {/* Quick Contact Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 truncate" dir="ltr">
                    {selectedUser.email || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700" dir="ltr">
                      {selectedUser.phone || "—"}
                    </span>
                  </div>
                  {formatCleanPhone(selectedUser.phone) && (
                    <a
                      href={`https://wa.me/${formatCleanPhone(selectedUser.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>واتساب</span>
                    </a>
                  )}
                </div>
              </div>

              {/* UserDetailRecord Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#123D3A]" />
                    <span>سجل واهتمامات الطالب (UserDetailRecord)</span>
                  </h4>
                  {selectedUser.userDetail ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      استمارة موثقة ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      لم تُسجل بعد
                    </span>
                  )}
                </div>

                {selectedUser.userDetail ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">المنطقة والمدينة</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {[selectedUser.userDetail.District || "إدلب", selectedUser.userDetail.city]
                            .filter(Boolean)
                            .join(" - ") || "إدلب"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">المستوى التعليمي</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedUser.userDetail.educationLevel || "غير محدد"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">التخصص الأكاديمي</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedUser.userDetail.specialization || "غير محدد"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">اللغة الإنجليزية</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedUser.userDetail.englishLevel || "متوسط"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">استخدام الحاسوب</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedUser.userDetail.computerUsage || "متوسط"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">تفضيل الرسوم</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedUser.userDetail.freeCourses && selectedUser.userDetail.paidCourses
                            ? `مجاني ومدفوع ($${selectedUser.userDetail.paidCoursesLimit || 0})`
                            : selectedUser.userDetail.freeCourses
                            ? "مجاني فقط"
                            : `مدفوع ($${selectedUser.userDetail.paidCoursesLimit || 0})`}
                        </span>
                      </div>
                    </div>

                    {/* Interests & Required Courses */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#D58A38]" />
                          <span>الاهتمام المسجل:</span>
                        </span>
                        {selectedUser.userDetail.createdAt && (
                          <span className="text-[10px] text-amber-800/70 font-normal">
                            {new Date(
                              selectedUser.userDetail.createdAt || selectedUser.userDetail.create_at || ""
                            ).toLocaleDateString("ar-SY")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {selectedUser.userDetail.interests || "عام / غير محدد"}
                      </p>

                      {selectedUser.userDetail.requiredCourses &&
                        selectedUser.userDetail.requiredCourses.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {selectedUser.userDetail.requiredCourses.map((rc, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900"
                              >
                                {rc}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 rounded-xl text-center space-y-1.5">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      لم يقم المستخدم بتعبئة استمارة رغبات واهتمامات التدريب بعد
                    </p>
                    <p className="text-[11px] text-slate-400">
                      تظهر تفاصيل الطالب تلقائياً هنا عند قيامه بطلب تدريب عبر المنصة.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl text-xs font-bold h-9 px-4"
                >
                  إغلاق
                </Button>

                <Link
                  href={`/admin/users/${selectedUser._id}`}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-black text-white bg-[#123D3A] hover:bg-[#0E2F2D] transition shadow-xs"
                >
                  <span>عرض الصفحة الكاملة للمستخدم</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
