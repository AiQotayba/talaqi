import React from "react";
import { cn } from "@/lib/utils";

/**
 * Core Primitive Skeleton
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/80 pointer-events-none select-none",
        className
      )}
      {...props}
    />
  );
}

/**
 * 1. Single Course Card Skeleton
 */
export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-3xl border border-slate-200/90 p-4 space-y-3.5 shadow-xs">
      {/* Banner Image */}
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200/80" />

      {/* Meta Tag & Title */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-28 rounded-md bg-slate-200/60" />
        <Skeleton className="h-5 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-3/5 rounded-lg bg-slate-200/60" />
      </div>

      {/* Details Row: Location, Duration */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Bottom Action Button */}
      <div className="pt-1">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Grid of Course Cards
 */
export function CoursesSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 2. Center / Organization Card Skeleton
 */
export function CenterCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-xs">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl bg-slate-200/90" />
        <Skeleton className="h-5 w-20 rounded-full bg-slate-200/70" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-1/2 rounded-md bg-slate-200/60" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Grid of Centers
 */
export function CentersSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <CenterCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 3. Course Details Dialog Skeleton (for Admin & Quick View)
 */
export function CourseDialogSkeleton() {
  return (
    <div className="text-right space-y-0">
      {/* Banner */}
      <Skeleton className="w-full h-48 rounded-none border-b border-slate-100" />

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Title & Entity */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md bg-slate-200/60" />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>

        {/* Description Lines */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <Skeleton className="h-4 w-28 rounded-md mb-2" />
          <Skeleton className="h-3.5 w-full rounded-md bg-slate-200/60" />
          <Skeleton className="h-3.5 w-11/12 rounded-md bg-slate-200/60" />
          <Skeleton className="h-3.5 w-4/5 rounded-md bg-slate-200/60" />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. User Details Dialog Skeleton
 */
export function UserDialogSkeleton() {
  return (
    <div className="text-right space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md bg-slate-200/60" />
        </div>
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Contact & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>

        {/* Interests & Skills */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-xl" />
            <Skeleton className="h-7 w-32 rounded-xl" />
            <Skeleton className="h-7 w-20 rounded-xl" />
          </div>
        </div>

        {/* Education & Info */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Form Dialog Skeleton (for EditCourse & CenterForm)
 */
export function DialogFormSkeleton() {
  return (
    <div className="text-right space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28 rounded-md" />
          <Skeleton className="h-6 w-52 rounded-lg" />
        </div>
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>

      {/* Form Fields Body */}
      <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 6. Student Apply Page Form Skeleton
 */
export function ApplyFormSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6 text-right">
      {/* Form Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <Skeleton className="h-4 w-3/4 rounded-md bg-slate-200/60" />
      </div>

      {/* Form Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        {/* Section 1: Skills pills */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl mt-2" />
        </div>

        {/* Section 2: Contact fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>

        {/* Section 4: Submit button */}
        <div className="pt-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 7. Send Training Wizard Skeleton (Step 1, 2, 3)
 */
export function SendTrainingSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-right">
      {/* Wizard Steps Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <div className="flex justify-between pt-3 border-t border-slate-100">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#123D3A] rounded-2xl p-6 space-y-4">
          <Skeleton className="h-4 w-32 bg-white/20 rounded-md" />
          <Skeleton className="h-14 w-44 bg-white/30 rounded-xl" />
          <Skeleton className="h-10 w-full bg-white/20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 8. Single Course Detail Page Skeleton
 */
export function SingleCoursePageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6 text-right">
      {/* Hero Banner */}
      <Skeleton className="w-full h-72 sm:h-96 rounded-3xl" />

      {/* Grid: Main Info + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <Skeleton className="h-4 w-full rounded-md bg-slate-200/60" />
            <Skeleton className="h-4 w-full rounded-md bg-slate-200/60" />
            <Skeleton className="h-4 w-5/6 rounded-md bg-slate-200/60" />
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 9. Stats Dashboard Skeleton
 */
export function StatsDashboardSkeleton() {
  return (
    <div className="space-y-7 text-right">
      {/* Hero Top Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-md bg-slate-200/60" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      {/* Chart + Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
