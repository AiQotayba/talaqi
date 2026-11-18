"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogFormSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadImageToBlob } from "@/lib/blob";
import CountryPhoneInput from "@/components/forms-client/CountryPhoneInput";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface CenterFormDialogProps {
  centerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CenterFormDialog({
  centerId,
  isOpen,
  onClose,
  onSuccess,
}: CenterFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [orgType, setOrgType] = useState<string>("ngo");
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("مدينة إدلب");
  const [district, setDistrict] = useState("إدلب");
  const [street, setStreet] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setLegalName("");
    setOrgType("ngo");
    setLogoUrl("");
    setContactPhone("");
    setContactEmail("");
    setWebsite("");
    setCity("مدينة إدلب");
    setDistrict("إدلب");
    setStreet("");
    setIsVerified(true);
    setDescription("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (centerId) {
      let active = true;
      setLoading(true);
      axios
        .get(`/api/admin/centers/${centerId}`)
        .then(({ data }) => {
          if (!active) return;
          const c = data?.data || data;
          if (c) {
            setName(c.name || "");
            setLegalName(c.legalName || "");
            setOrgType(c.orgType || "ngo");
            setLogoUrl(c.logo || "");
            setContactPhone(c.contactPhone || "");
            setContactEmail(c.contactEmail || "");
            setWebsite(c.website || "");
            setCity(c.address?.city || "مدينة إدلب");
            setDistrict(c.address?.district || "إدلب");
            setStreet(c.address?.street || "");
            setIsVerified(Boolean(c.isVerified));
            setDescription(c.description || "");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch center:", err);
          toast.error("فشل في جلب بيانات المركز");
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    } else {
      resetForm();
    }
  }, [centerId, isOpen]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    try {
      setIsUploadingLogo(true);
      const url = await uploadImageToBlob(file);
      setLogoUrl(url);
      toast.success("تم رفع الشعار على Vercel Blob بنجاح ✨");
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast.error("فشل رفع الشعار: " + (err.message || "خطأ غير متوقع"));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم المركز أو المنظمة مطلوب");
      return;
    }

    setSaving(true);
    const token = Cookies.get("authorization");
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      name: name.trim(),
      legalName: legalName.trim(),
      orgType,
      logo: logoUrl.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      website: website.trim(),
      address: {
        country: "سوريا",
        city: city.trim(),
        district: district.trim(),
        street: street.trim(),
      },
      isVerified,
      description: description.trim(),
    };

    try {
      if (centerId) {
        await axios.put(`/api/admin/centers/${centerId}`, payload, { headers });
        toast.success("تم تحديث بيانات المركز الشريك بنجاح 🎉");
      } else {
        await axios.post(`/api/admin/centers`, payload, { headers });
        toast.success("تمت إضافة المركز الشريك بنجاح 🏢");
      }

      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save center:", err);
      toast.error("حدث خطأ أثناء الحفظ: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(centerId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-slate-700 bg-white">
        {loading ? (
          <DialogFormSkeleton />
        ) : (
          <form onSubmit={handleSubmit} className="text-right">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-[#123D3A] uppercase tracking-wider block mb-1">
                  إدارة الشركاء والمراكز المتعاقد معها
                </span>
                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {isEditing ? "تعديل بيانات المركز الشريك" : "إضافة مركز / منظمة تدريبية شريكة"}
                </DialogTitle>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* 1. Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    اسم المركز أو المنظمة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: منظمة بوينت (POINT)"
                    required
                    className="h-10 text-xs sm:text-sm font-bold rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">نوع الجهة التدريبية</Label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#123D3A]"
                  >
                    <option value="ngo">منظمة إنسانية تنموية (NGO)</option>
                    <option value="institute">معهد مهني / أكاديمي معتمد</option>
                    <option value="company">شركة تقنية / أكاديمية تكنولوجية</option>
                    <option value="governmental">مؤسسة تدريبية حكومية</option>
                    <option value="university">جامعة / كلية جامعية</option>
                    <option value="initiative">مبادرة شبابية رائدة</option>
                  </select>
                </div>
              </div>

              {/* 2. Legal / Registration Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  الاسم القانوني أو الترخيص والرمز التعريفي (اختياري)
                </Label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="مثال: POINT Organization for Human Development"
                  className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                />
              </div>

              {/* 3. Logo Upload via Vercel Blob */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>شعار المركز (Logo) - سحابة Vercel Blob</span>
                  </span>
                  {isUploadingLogo && (
                    <span className="text-[11px] text-[#123D3A] font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      جاري رفع الشعار...
                    </span>
                  )}
                </Label>

                {logoUrl ? (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Center Logo"
                      className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم رفع الشعار بنجاح
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                        {logoUrl}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setLogoUrl("")}
                      className="text-slate-400 hover:text-red-600 rounded-xl p-2 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#123D3A]/40 bg-slate-50/50 hover:bg-slate-50 transition p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      اضغط لاختيار شعار المركز لرفعه على Vercel Blob
                    </span>
                    <span className="text-[11px] text-slate-400">PNG, SVG, JPG أو WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploadingLogo}
                    />
                  </label>
                )}
              </div>

              {/* 4. Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>رقم هاتف / واتساب التواصل</span>
                  </Label>
                  <CountryPhoneInput
                    value={contactPhone}
                    onChange={setContactPhone}
                    placeholder="رقم مسؤول التنسيق"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>البريد الإلكتروني الرسمي</span>
                  </Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@point-ngo.org"
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* 5. City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">المدينة / البلدة</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مدينة إدلب، سرمدا، الدانا..."
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">المحافظة / المنطقة</Label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="إدلب"
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">العنوان التفصيلي / الشارع</Label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="حي الضبيط، قرب دوار المحراب..."
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                  />
                </div>
              </div>

              {/* 6. Website & Verification Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#123D3A]" />
                    <span>الموقع الإلكتروني أو صفحة فيسبوك</span>
                  </Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://point.ngo"
                    className="h-10 text-xs rounded-xl border-slate-200 focus:border-[#123D3A]"
                    dir="ltr"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition select-none">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="w-4 h-4 text-[#123D3A] rounded border-slate-300 focus:ring-[#123D3A]"
                    />
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        شريك معتمد وموثق رسمياً (Verified Partner)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 7. Description / Contract Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#123D3A]" />
                  <span>نبذة عن المركز وتفاصيل اتفاقية التعاقد / الشراكة</span>
                </Label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مجالات التعاون، البرامج التدريبية المعتمدة مع المركز، مدة التعاقد، وملاحظات التنسيق..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123D3A]/20 transition leading-relaxed resize-y"
                />
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
                disabled={saving || !name.trim()}
                className="rounded-xl text-xs font-bold h-9 bg-[#123D3A] hover:bg-[#0E2F2D] text-white flex items-center gap-2 shadow-xs transition"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isEditing ? "حفظ التعديلات" : "إضافة المركز الشريك"}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
