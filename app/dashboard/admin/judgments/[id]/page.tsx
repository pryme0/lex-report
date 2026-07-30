"use client";

import { use } from "react";
import { adminApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AdminAsyncSection, AdminAccessDenied, isEditorAccessError } from "@/components/admin/AdminAsyncSection";
import { JudgmentForm, adminCaseToDraft } from "@/components/admin/JudgmentForm";

export default function EditJudgmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const caseQuery = useApiQuery(`admin:case:${id}`, () => adminApi.case(id));

  if (isEditorAccessError(caseQuery.error)) return <AdminAccessDenied />;

  return (
    <div>
      <AdminAsyncSection query={caseQuery} loadingLabel="Loading judgment…">
        {(item) => (
          <>
            <div className="admin-page-head">
              <h3 className="admin-page-title">{item.title}</h3>
              <span
                className={`admin-pill${item.published ? " admin-pill-published" : " admin-pill-draft"}`}
              >
                {item.published ? "Published" : "Draft"}
              </span>
            </div>
            <JudgmentForm
              mode="edit"
              initial={adminCaseToDraft(item)}
              published={item.published}
              onSaved={(updated) => caseQuery.setData(updated)}
            />
          </>
        )}
      </AdminAsyncSection>
    </div>
  );
}
