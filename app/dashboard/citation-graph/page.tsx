"use client";

import { CitationGraph } from "@/components/CitationGraph";
import { useDashboard } from "@/contexts/DashboardContext";

export default function Page() {
  const { graphCase, showToast } = useDashboard();
  return <CitationGraph onAction={showToast} centerCase={graphCase} />;
}
