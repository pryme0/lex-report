"use client";

import { use } from "react";
import { StatuteEditor } from "@/components/admin/StatuteEditor";

export default function EditStatutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <div className="admin-page-head">
        <h3 className="admin-page-title">Edit statute</h3>
      </div>
      <StatuteEditor mode="edit" statuteId={id} />
    </div>
  );
}
