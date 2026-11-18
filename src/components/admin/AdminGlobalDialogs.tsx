"use client";

import React, { Suspense } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import CourseDetailsDialog from "./CourseDetailsDialog";
import UserDetailsDialog from "./UserDetailsDialog";
import EditCourseDialog from "./EditCourseDialog";
import CenterFormDialog from "./CenterFormDialog";

function AdminGlobalDialogsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseId = searchParams?.get("courseId") || null;
  const userId = searchParams?.get("userId") || searchParams?.get("studentId") || null;
  const editCourseId = searchParams?.get("editCourseId") || null;
  const centerId = searchParams?.get("centerId") || null;
  const newCenter = searchParams?.get("newCenter") === "true";

  const clearParams = (keys: string[]) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    keys.forEach((k) => params.delete(k));
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const handleEditCourseFromDetails = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("courseId");
    params.set("editCourseId", id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* 1. Global Course Details View Dialog */}
      <CourseDetailsDialog
        courseId={courseId}
        onClose={() => clearParams(["courseId"])}
        onEdit={handleEditCourseFromDetails}
      />

      {/* 2. Global Student/User Details Dialog */}
      <UserDetailsDialog
        userId={userId}
        onClose={() => clearParams(["userId", "studentId"])}
      />

      {/* 3. Global Edit Course Dialog */}
      <EditCourseDialog
        courseId={editCourseId}
        onClose={() => clearParams(["editCourseId"])}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* 4. Global Center / Partner Form Dialog (Add & Edit) */}
      <CenterFormDialog
        centerId={centerId}
        isOpen={Boolean(centerId || newCenter)}
        onClose={() => clearParams(["centerId", "newCenter"])}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}

export default function AdminGlobalDialogs() {
  return (
    <Suspense fallback={null}>
      <AdminGlobalDialogsContent />
    </Suspense>
  );
}
