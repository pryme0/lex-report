"use client";

import { DocumentBuilder } from "@/components/DocumentBuilder";
import { useDashboard } from "@/contexts/DashboardContext";

export default function Page() {
  const { showToast } = useDashboard();
  return <DocumentBuilder onAction={showToast} />;
}
