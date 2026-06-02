"use client";

import { DraftStudio } from "@/components/DraftStudio";
import { useDashboard } from "@/contexts/DashboardContext";

export default function Page() {
  const { showToast } = useDashboard();
  return <DraftStudio onAction={showToast} />;
}
