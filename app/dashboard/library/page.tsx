"use client";

import { useRouter } from "next/navigation";
import { Library } from "@/components/Library";
import { useDashboard } from "@/contexts/DashboardContext";

export default function Page() {
  const { showToast } = useDashboard();
  const router = useRouter();
  return <Library onGoToDraftStudio={() => router.push("/dashboard/draft-studio")} onAction={showToast} />;
}
