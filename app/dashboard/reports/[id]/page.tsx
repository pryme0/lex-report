"use client";

import { use } from "react";
import { ReportBatchDetail } from "@/components/ReportBatchDetail";

export default function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportBatchDetail batchId={id} />;
}
