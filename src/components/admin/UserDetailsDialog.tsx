"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserDialogSkeleton } from "@/components/ui/skeleton";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  BookOpen,
  Clock,
  Loader2,
  DollarSign,
  GraduationCap,
} from "lucide-react";

interface UserDetailsDialogProps {
  userId: string | null;
  onClose: () => void;
}

export default function UserDetailsDialog({
  userId,
  onClose,
}: UserDetailsDialogProps) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStudent(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/admin/users-details/${userId}`)
      .then(({ data }) => {
        if (active) {
          setStudent(data?.data || data);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Error fetching user details:", err);
          setError("فشل في تحميل بيانات الطالب أو أنه غير موجود.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const isOpen = Boolean(userId);

  const formatCleanPhone = (phoneStr: string) => {
    if (!phoneStr) return "";
    let clean = phoneStr.replace(/[^0-9]/g, "");
    if (clean.startsWith("00")) clean = clean.substring(2);
    if (clean.startsWith("09")) clean = "963" + clean.substring(1);
    return clean;
  };

  const cleanPhone = student?.phone ? formatCleanPhone(student.phone) : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-slate-700 bg-white">
        {loading && <UserDialogSkeleton />}

        {error && (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs font-bold text-red-600">{error}</p>
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              إغلاق
            </Button>
          </div>
        )}

        {!loading && !error && student && (
          <div className="text-right">
            {/* Header: Name + Contact Badges */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#123D3A] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  {student.fullName ? student.fullName.charAt(0) : "ط"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {student.fullName || "طالب بدون اسم"}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5" dir="ltr">
                    {student.phone || "لا يوجد هاتف"}
                  </span>
                </div>
              </div>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>واتساب</span>
                </a>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Location Card */}
              <div className="p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D58A38] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">الموقع الجغرافي</span>
                  <span className="block text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                    {student.city && student.District
                      ? `${student.District} - ${student.city}`
                      : student.city || student.District || "إدلب"}
                  </span>
                </div>
              </div>

              {/* Training Interests */}
              <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#123D3A]" />
                  <span className="text-xs font-bold text-slate-800">الاهتمامات والرغبة التدريبية:</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed bg-white border border-slate-200 p-3 rounded-xl">
                  {student.interests || "عام / غير محدد"}
                </p>

                {student.requiredCourses && student.requiredCourses.length > 0 && (
                  <div className="pt-2">
                    <span className="block text-[11px] text-slate-500 font-medium mb-1">
                      دورات مسجلة ومطلوبة بالاسم:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {student.requiredCourses.map((c: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences & Registration Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl">
                  <span className="block text-[11px] text-slate-400 font-medium">نوع التدريب المفضل</span>
                  <div className="mt-1">
                    {student.freeCourses && (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60 ml-1.5">
                        دورات مجانية
                      </span>
                    )}
                    {student.paidCourses && (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/60">
                        مأجورة (حتى {student.paidCoursesLimit || 0} $)
                      </span>
                    )}
                    {!student.freeCourses && !student.paidCourses && (
                      <span className="text-xs font-bold text-slate-600">غير محدد</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl">
                  <span className="block text-[11px] text-slate-400 font-medium">تاريخ تقديم الطلب</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {student.createdAt || student.create_at
                        ? new Date(student.createdAt || student.create_at).toLocaleDateString("ar-SY", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "غير محدد"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-9"
              >
                إغلاق النافذة
              </Button>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مراسلة واتساب</span>
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
