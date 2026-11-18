import Headers from '../../config';
import { Header } from '../../AdminHeader';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import UserDetails from '@/models/UserDetails';
import Link from 'next/link';
import {
  User as UserIcon,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Briefcase,
  Languages,
  Laptop,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default async function OneUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers: any = await Headers();

  if (!headers?.Authorization) {
    redirect('/auth?route=login');
  }

  let user: any = null;
  let userDetail: any = null;

  try {
    await connectToDatabase();
    user = await User.findById(id).select('-password').lean();

    if (user) {
      userDetail = await UserDetails.findOne({
        deleteState: { $ne: true },
        $or: [
          { user_id: user._id },
          { email: user.email },
          { phone: user.phone },
        ],
      }).lean();
    }
  } catch (err) {
    console.error('Error loading user:', err);
  }

  if (!user) {
    return (
      <main className="w-full p-4 sm:p-6 max-w-4xl mx-auto">
        <Header to="/admin/users" title="المستخدم غير موجود" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          لم يتم العثور على بيانات هذا المستخدم
        </div>
      </main>
    );
  }

  return (
    <main className="w-full p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              الملف الشخصي: {user.name}
            </h1>
            <p className="text-xs text-slate-500">
              عرض بيانات الحساب وسجل رغبات واهتمامات الطالب (UserDetailRecord)
            </p>
          </div>
        </div>

        <Link
          href="/admin/users"
          className="text-xs font-bold text-[#123D3A] hover:underline"
        >
          العودة لقائمة المستخدمين
        </Link>
      </div>

      <UserProfileFullView user={user} userDetail={userDetail} />
    </main>
  );
}

function UserProfileFullView({ user, userDetail }: { user: any; userDetail: any }) {
  const userRoles: string[] = user.roles || (user.role ? [user.role] : ['student']);
  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
  const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('09')
    ? '963' + cleanPhone.substring(1)
    : cleanPhone;

  return (
    <div className="space-y-5">
      {/* 1. Account Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-[#123D3A]/10 text-[#123D3A]'
              }`}
            >
              {isAdmin ? <Shield className="w-7 h-7 text-amber-700" /> : user.name?.charAt(0) || 'م'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">{user.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isAdmin
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isAdmin ? 'مسؤول (Admin)' : 'طالب (Student)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1 font-mono" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
                {user.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      انضم: {new Date(user.createdAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs self-stretch sm:self-auto justify-center"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>مراسلة واتساب</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. UserDetailRecord Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#123D3A]" />
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              سجل تفاصيل واهتمامات الطالب (UserDetailRecord)
            </h3>
          </div>
          {userDetail ? (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              استمارة مسجلة وموثقة ✓
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              لم تُسجل استمارة بعد
            </span>
          )}
        </div>

        {userDetail ? (
          <div className="space-y-4">
            {/* Grid of detail fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D58A38]" />
                  <span>المنطقة والمدينة</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {[userDetail.District || 'إدلب', userDetail.city].filter(Boolean).join(' - ') || 'إدلب'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#123D3A]" />
                  <span>المستوى التعليمي</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {userDetail.educationLevel || 'غير محدد'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#123D3A]" />
                  <span>التخصص الأكاديمي</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {userDetail.specialization || 'غير محدد'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <Languages className="w-3 h-3 text-slate-400" />
                  <span>مستوى اللغة الإنجليزية</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {userDetail.englishLevel || 'متوسط'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" />
                  <span>استخدام الحاسوب</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {userDetail.computerUsage || 'متوسط'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>تفضيلات الرسوم</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {userDetail.freeCourses && userDetail.paidCourses
                    ? `مجاني ومدفوع (حد أقصى: $${userDetail.paidCoursesLimit || 0})`
                    : userDetail.freeCourses
                    ? 'تدريبات مجانية فقط'
                    : `مدفوع (حد أقصى: $${userDetail.paidCoursesLimit || 0})`}
                </span>
              </div>
            </div>

            {/* Interests & Courses wanted */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-amber-900">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#D58A38]" />
                  <span>الاهتمام والرغبة التدريبية المسجلة:</span>
                </span>
                {userDetail.createdAt && (
                  <span className="text-[11px] text-amber-800/80 font-normal">
                    تاريخ الطلب: {new Date(userDetail.createdAt || userDetail.create_at).toLocaleDateString('ar-SY')}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                {userDetail.interests || 'عام / غير محدد'}
              </p>

              {userDetail.requiredCourses && userDetail.requiredCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {userDetail.requiredCourses.map((rc: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-900 shadow-2xs"
                    >
                      {rc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 rounded-xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">
              لم يقم المستخدم بتعبئة استمارة رغبات واهتمامات التدريب بعد
            </h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              يمكن لهذا المستخدم تعبئة رغباته من خلال صفحة التقديم في المنصة ليتم ربط تفاصيل اهتماماته التدريبية تلقائياً بحسابه.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
