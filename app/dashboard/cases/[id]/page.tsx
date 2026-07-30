"use client";

import { use } from "react";
import { JudgmentDetail } from "@/components/JudgmentDetail";

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <JudgmentDetail caseId={id} variant="page" />;
}
