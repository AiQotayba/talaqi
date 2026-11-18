"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogFormSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadImageToBlob } from "@/lib/blob";
import {
  FileEdit,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Building2,
  MapPin,
  DollarSign,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";

interface EditCourseDialogProps {
  courseId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditCourseDialog({
  courseId,
  onClose,
  onSuccess,
}: EditCourseDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [context, setContext] = useState("");
  const [center, setCenter] = useState("");
  const [location, setLocation] = useState("إدلب");
  const [locationType, setLocationType] = useState<"in_person" | "online" | "hybrid">("in_person");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [ageStart, setAgeStart] = useState(15);
  const [ageEnd, setAgeEnd] = useState(35);
  const [links, setLinks] = useState("");
  const [keys, setKeys] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/admin/courses/${courseId}`)
      .then(({ data }) => {
        if (!active) return;
        const c = data?.data || data;
        if (c) {
          setTitle(c.title || "");
          setSummary(c.summary || "");
          setContext(c.context || "");
          setCenter(c.providingEntity?.name || c.center || "");
          setLocation(c.locationDetails?.city || c.location || "إدلب");
          setLocationType(c.locationType || "in_person");
          const free = c.pricing?.isFree ?? (c.price === 0 || !c.price);
          setIsFree(free);
          setPrice(c.pricing?.cost || c.price || 0);
          setAgeStart(c.age?.start || 15);
          setAgeEnd(c.age?.end || 35);

          const linksVal = Array.isArray(c.links) ? c.links.join("\n") : c.links || "";
          setLinks(linksVal);

          const keysVal = Array.isArray(c.keys) ? c.keys.join(", ") : c.keys || "";
          setKeys(keysVal);

          if (typeof c.image === "string" && c.image.startsWith("http")) {
            setImageUrl(c.image);
          } else {
            setImageUrl("");
          }
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load course for editing:", err);
          setError("فشل في تحميل بيانات الدورة للتعديل.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5 ميغابايت");
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImageToBlob(file);
      setImageUrl(uploadedUrl);
      toast.success("تم رفع الصورة على Vercel Blob بنجاح ✨");
    } catch (err: any) {
      console.error("Image upload failed:", err);
      toast.error("فشل رفع الصورة: " + (err.message || "خطأ غير متوقع"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان الدورة مطلوب");
      return;
    }

    setSaving(true);
    const token = Cookies.get("authorization");

    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        context: context.trim(),
        center: center.trim(),
        providingEntity: {
          name: center.trim() || "جهة تدريبية معتمدة",
          logo: "",
        },
        location: location.trim(),
        locationType,
        locationDetails: {
          city: location.trim() || "إدلب",
          country: "سوريا",
        },
        price: isFree ? 0 : Number(price) || 0,
        pricing: {
          isFree,
          cost: isFree ? 0 : Number(price) || 0,
          currency: "USD",
          stipendProvided: false,
        },
        age: {
          start: Number(ageStart) || 15,
          end: Number(ageEnd) || 35,
        },
        links: links.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean),
        keys: keys.split(/[,،]+/).map((k) => k.trim()).filter(Boolean),
        image: imageUrl.trim(),
        status: "published",
      };

      await axios.put(`/api/admin/courses/${courseId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("تم حفظ وتحديث بيانات الدورة بنجاح 🎉");
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update course:", err);
      toast.error("حدث خطأ أثناء حفظ التعديلات: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const isOpen = Boolean(courseId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-slate-700 bg-white">
        {loading && <DialogFormSkeleton />}

        {error && (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs font-bold text-red-600">{error}</p>
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              إغلاق
            </Button>
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSave} className="text-right">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-[#123D3A] uppercase tracking-wider block mb-1">
                  إدارة المحتوى التدريبي
                </span>
                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  تعديل بيانات الدورة التدريبية
                </DialogTitle>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#123D3A]/10 text-[#123D3A] flex items-center justify-center shrink-0">
                <FileEdit className="w-5 h-5" />
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* 1. Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  عنوان الدورة التدريبية <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: دبلوم صيانة الهواتف الذكية والبرمجيات"
                  required
                  className="h-10 text-xs sm:text-sm font-bold rounded-xl border-slate-200 focus:border-[#123D3A]"
                />
              </div>

              {/* 2. Center & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>الجهة المنفذة أو المركز</span>
                  </Label>
                  <Input
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    placeholder="مثال: منظمة بنفسج، مركز نيرد، جامعة إدلب..."
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D58A38]" />
                    <span>المدينة / المنطقة</span>
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="إدلب المدينة، سرمدا، الدانا، أريحا..."
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>
              </div>

              {/* 3. Location Type & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">نوع الحضور</Label>
                  <select
                    value={locationType}
                    onChange={(e: any) => setLocationType(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#123D3A]"
                  >
                    <option value="in_person">حضوري في المركز</option>
                    <option value="online">عن بعد (أونلاين)</option>
                    <option value="hybrid">هجين (حضوري + أونلاين)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">التكلفة والرسوم</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFree(true);
                        setPrice(0);
                      }}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold border transition ${
                        isFree
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      مجاني بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFree(false)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold border transition ${
                        !isFree
                          ? "bg-[#D58A38] text-white border-[#D58A38]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      مأجور ($)
                    </button>
                    {!isFree && (
                      <Input
                        type="number"
                        min={1}
                        value={price || ""}
                        onChange={(e) => setPrice(Number(e.target.value) || 0)}
                        placeholder="$"
                        className="w-20 h-10 text-xs font-mono font-bold text-center rounded-xl border-slate-200"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Age Eligibility */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">العمر من</Label>
                  <Input
                    type="number"
                    value={ageStart || ""}
                    onChange={(e) => setAgeStart(Number(e.target.value) || 0)}
                    className="h-10 text-xs text-center rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">العمر إلى</Label>
                  <Input
                    type="number"
                    value={ageEnd || ""}
                    onChange={(e) => setAgeEnd(Number(e.target.value) || 0)}
                    className="h-10 text-xs text-center rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {/* 5. Image & Vercel Blob Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>صورة أو بوستر الدورة (تخزين Vercel Blob)</span>
                  </span>
                  {isUploadingImage && (
                    <span className="text-[11px] text-[#123D3A] font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      جاري رفع الصورة...
                    </span>
                  )}
                </Label>

                {imageUrl ? (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Course preview"
                      className="w-20 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        صورة معتمدة على السحابة
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                        {imageUrl}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setImageUrl("")}
                      className="text-slate-400 hover:text-red-600 rounded-xl p-2 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#123D3A]/40 bg-slate-50/50 hover:bg-slate-50 transition p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      اضغط لاختيار صورة جديدة لرفعها على Vercel Blob
                    </span>
                    <span className="text-[11px] text-slate-400">PNG, JPG, WebP حتى 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                )}
              </div>

              {/* 6. Summary */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">الملخص الموجز</Label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="ملخص مكثف عن أهداف التدريب والمهارات المكتسبة..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123D3A]/20 transition leading-relaxed resize-y"
                />
              </div>

              {/* 7. Detailed Context / Markdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">المحتوى التفصيلي والشروط (Markdown)</Label>
                <textarea
                  rows={6}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="تفاصيل المحاور، مواعيد التدريب، شروط القبول، وطريقة التقديم..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123D3A]/20 transition leading-relaxed resize-y"
                />
              </div>

              {/* 8. Registration Links & Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>روابط التسجيل والاستمارة</span>
                  </Label>
                  <textarea
                    rows={3}
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    placeholder="ضع كل رابط في سطر منفصل..."
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123D3A]/20 resize-y"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>الكلمات المفتاحية (مفصولة بفواصل)</span>
                  </Label>
                  <textarea
                    rows={3}
                    value={keys}
                    onChange={(e) => setKeys(e.target.value)}
                    placeholder="برمجة, حاسوب, ICDL, طاقة شمسية, تمكين شباب..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123D3A]/20 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl text-xs font-bold h-9"
              >
                إلغاء
              </Button>

              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-xl text-xs font-bold h-9 bg-[#123D3A] hover:bg-[#0E2F2D] text-white flex items-center gap-2 shadow-xs transition"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>حفظ التعديلات</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
