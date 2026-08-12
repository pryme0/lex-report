"use client";

import { DraftStudioRedesign } from "@/components/DraftStudioRedesign";
import { useDashboard } from "@/contexts/DashboardContext";

export default function Page() {
  const { showToast } = useDashboard();
  return <DraftStudioRedesign onAction={showToast} />;
}
