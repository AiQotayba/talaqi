"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CourseDialogSkeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  ExternalLink,
  MessageCircle,
  FileEdit,
  Loader2,
  CheckCircle2,
  Tag,
  BookOpen,
} from "lucide-react";

interface CourseDetailsDialogProps {
  courseId: string | null;
  onClose: () => void;
  onEdit?: (courseId: string) => void;
}

export default function CourseDetailsDialog({
  courseId,
  onClose,
  onEdit,
}: CourseDetailsDialogProps) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/admin/courses/${courseId}`)
      .then(({ data }) => {
        if (active) {
          setCourse(data?.data || data);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Error fetching course details:", err);
          setError("فشل في تحميل تفاصيل الدورة، قد تكون حُذفت.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const isOpen = Boolean(courseId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-slate-700 bg-white">
        {loading && <CourseDialogSkeleton />}

        {error && (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs font-bold text-red-600">{error}</p>
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              إغلاق
            </Button>
          </div>
        )}

        {!loading && !error && course && (
          <div className="text-right">
            {/* Image Banner */}
            {course.image && typeof course.image === "string" && course.image.startsWith("http") && (
              <div className="w-full h-48 bg-slate-100 relative overflow-hidden border-b border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-5 left-5 text-white">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                    {course.providingEntity?.name || course.center || "جهة معتمدة"}
                  </span>
                  <h2 className="text-base sm:text-lg font-black leading-tight drop-shadow-sm">
                    {course.title}
                  </h2>
                </div>
              </div>
            )}

            {/* Header without image */}
            {(!course.image || typeof course.image !== "string" || !course.image.startsWith("http")) && (
              <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                <span className="text-[11px] font-black text-[#123D3A] uppercase tracking-wider block mb-1">
                  {course.providingEntity?.name || course.center || "جهة معتمدة"}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {course.title}
                </h2>
              </div>
            )}

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {course.summary && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">الملخص العام</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                    {course.summary}
                  </p>
                </div>
              )}

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block text-[11px] mb-1">الموقع ونوع الحضور</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D58A38]" />
                    {course.locationType === "online"
                      ? "عن بعد (أونلاين)"
                      : `${course.locationDetails?.city || course.location || "إدلب"}`}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block text-[11px] mb-1">الرسوم والتكلفة</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    {course.pricing?.isFree || course.price === 0
                      ? "منحة مجانية بالكامل"
                      : `${course.pricing?.cost || course.price} دولار أمريكي`}
                  </span>
                </div>

                {course.age && (course.age.start || course.age.end) && (
                  <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <span className="text-slate-400 block text-[11px] mb-1">الفئة العمرية المستهدفة</span>
                    <span className="font-bold text-slate-800">
                      من {course.age.start || 15} إلى {course.age.end || 35} سنة
                    </span>
                  </div>
                )}

                {course.createdAt && (
                  <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <span className="text-slate-400 block text-[11px] mb-1">تاريخ النشر</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(course.createdAt).toLocaleDateString("ar-SY", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags / Keywords */}
              {course.keys && course.keys.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    الكلمات المفتاحية والتصنيفات:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(course.keys) ? course.keys : String(course.keys).split(/[,،]+/)).map(
                      (k: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold"
                        >
                          {k.trim()}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Full Context / Description */}
              {course.context && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">تفاصيل المحتوى والشروط</span>
                  <div className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-200 whitespace-pre-wrap">
                    {course.context}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs h-9 font-bold"
              >
                إغلاق
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    if (onEdit) {
                      onEdit(course._id);
                    } else {
                      router.push(`?editCourseId=${course._id}`);
                    }
                  }}
                  className="rounded-xl text-xs font-bold h-9 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>تعديل الدورة</span>
                </Button>

                <Link
                  href={`/admin/send-training?courseId=${course._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                  <span>مراسلة واتساب</span>
                </Link>

                <Link
                  href={`/courses/${course._id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>الموقع</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
