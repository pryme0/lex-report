"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Library } from "@/components/Library";
import { useDashboard } from "@/contexts/DashboardContext";

function LibraryPageContent() {
  const { showToast } = useDashboard();
  const router = useRouter();
  return (
    <Library
      onGoToDraftStudio={() => router.push("/dashboard/draft-studio")}
      onAction={showToast}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LibraryPageContent />
    </Suspense>
  );
}
