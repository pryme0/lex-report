"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BATCH_STATUSES, reportsApi, usersApi } from "@/lib/api";
import type { CaseSummary, Paginated, ReportBatch } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AsyncSection } from "@/components/AsyncState";
import { CaseEntry } from "./CaseEntry";
import { FormBanner, SelectInput, TextInput } from "@/components/admin/FormControls";
import { emptyErrors, type FieldErrors } from "@/components/admin/formUtils";

type BatchForm = {
  court: string;
  topic: string;
  status: string;
};

const EMPTY_BATCH_FORM: BatchForm = { court: "", topic: "", status: "Digesting" };

const STATUS_OPTIONS = BATCH_STATUSES.filter((s) => s !== "Published").map((s) => ({
  value: s,
  label: s,
}));

export function Reports() {
  const { showToast } = useDashboard();
  const [publishedPage, setPublishedPage] = useState(1);
  const [batchPage, setBatchPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState<BatchForm>(EMPTY_BATCH_FORM);
  const [formErrors, setFormErrors] = useState<FieldErrors>(emptyErrors());

  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());
  const isEditor = profileQuery.data?.editor ?? false;

  const publishedQuery = useApiQuery(`reports:published:${publishedPage}`, () =>
    reportsApi.published({ limit: 20, page: publishedPage }),
  );

  const batchesQuery = useApiQuery(
    isEditor ? `reports:batches:${batchPage}:${statusFilter}` : null,
    () =>
      reportsApi.batches({
        limit: 20,
        page: batchPage,
        status: statusFilter || undefined,
      }),
  );

  const createBatch = useApiMutation((body: { court?: string; topic?: string; status?: string }) =>
    reportsApi.createBatch(body),
  );

  async function handleCreateBatch(event: React.FormEvent) {
    event.preventDefault();
    const result = await createBatch.mutate({
      court: batchForm.court.trim() || undefined,
      topic: batchForm.topic.trim() || undefined,
      status: batchForm.status || undefined,
    });
    if (!result) {
      if (createBatch.error) setFormErrors({ _form: createBatch.error });
      return;
    }
    showToast(`Editorial batch created${result.topic ? `: ${result.topic}` : ""}.`);
    setBatchForm(EMPTY_BATCH_FORM);
    setShowBatchForm(false);
    setFormErrors(emptyErrors());
    batchesQuery.refetch();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="label">Law reports</p>
          <h2>Editorial workflow</h2>
        </div>
        {isEditor && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBatchForm((open) => !open)}
          >
            <Plus size={12} /> New batch
          </button>
        )}
      </div>

      {isEditor && showBatchForm && (
        <form className="admin-form admin-inline-form" onSubmit={handleCreateBatch}>
          <FormBanner errors={formErrors} />
          <div className="admin-form-grid">
            <TextInput
              id="batch-court"
              label="Court"
              placeholder="e.g. SC"
              value={batchForm.court}
              disabled={createBatch.pending}
              onChange={(v) => setBatchForm((prev) => ({ ...prev, court: v }))}
            />
            <TextInput
              id="batch-topic"
              label="Topic"
              placeholder="e.g. Banking priority"
              value={batchForm.topic}
              disabled={createBatch.pending}
              onChange={(v) => setBatchForm((prev) => ({ ...prev, topic: v }))}
            />
            <SelectInput
              id="batch-status"
              label="Starting status"
              value={batchForm.status}
              options={STATUS_OPTIONS}
              disabled={createBatch.pending}
              onChange={(v) => setBatchForm((prev) => ({ ...prev, status: v }))}
            />
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowBatchForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createBatch.pending}>
              {createBatch.pending ? "Creating…" : "Create batch"}
            </button>
          </div>
        </form>
      )}

      {isEditor && (
        <div className="reports-section">
          <div className="reports-section-head">
            <div>
              <p className="label">Editorial</p>
              <h3 className="reports-section-title">Batch queue</h3>
            </div>
            <div className="admin-filter-tabs" role="tablist" aria-label="Batch status filter">
              <button
                type="button"
                role="tab"
                aria-selected={!statusFilter}
                className={`admin-filter-tab${!statusFilter ? " active" : ""}`}
                onClick={() => {
                  setStatusFilter("");
                  setBatchPage(1);
                }}
              >
                All
              </button>
              {BATCH_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === s}
                  className={`admin-filter-tab${statusFilter === s ? " active" : ""}`}
                  onClick={() => {
                    setStatusFilter(s);
                    setBatchPage(1);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <AsyncSection
            query={batchesQuery}
            loadingLabel="Loading batches…"
            emptyMessage="No batches match this filter."
            isEmpty={(d: Paginated<ReportBatch>) => d.data.length === 0}
          >
            {(data) => (
              <>
                <div className="reports-batch-grid">
                  {data.data.map((batch) => (
                    <Link
                      key={batch.id}
                      href={`/dashboard/reports/${batch.id}`}
                      className="reports-batch-card"
                    >
                      <div className="reports-batch-card-head">
                        <span className="reports-batch-topic">
                          {batch.topic || "Untitled batch"}
                        </span>
                        <span
                          className={`admin-pill reports-status-${batch.status.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <p className="reports-batch-card-meta">
                        {batch.court || "—"} · {batch.caseIds.length} judgment
                        {batch.caseIds.length === 1 ? "" : "s"}
                        {batch.assignee ? ` · ${batch.assignee}` : ""}
                      </p>
                    </Link>
                  ))}
                </div>
                {data.meta.totalPages > 1 && (
                  <div className="admin-pagination">
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={data.meta.page <= 1}
                      onClick={() => setBatchPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {data.meta.page} of {data.meta.totalPages}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={data.meta.page >= data.meta.totalPages}
                      onClick={() => setBatchPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </AsyncSection>
        </div>
      )}

      <div className="reports-section">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <div>
            <p className="label">Published</p>
            <h3 className="reports-section-title">Reported judgments</h3>
          </div>
        </div>
        <div className="case-list">
          <AsyncSection
            query={publishedQuery}
            loadingLabel="Loading reports…"
            emptyMessage="No published judgments yet."
            isEmpty={(d: Paginated<CaseSummary>) => d.data.length === 0}
          >
            {(data) => (
              <>
                {data.data.map((item) => (
                  <CaseEntry key={item.id} item={item} />
                ))}
                {data.meta.totalPages > 1 && (
                  <div className="admin-pagination">
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={data.meta.page <= 1}
                      onClick={() => setPublishedPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {data.meta.page} of {data.meta.totalPages}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={data.meta.page >= data.meta.totalPages}
                      onClick={() => setPublishedPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </AsyncSection>
        </div>
      </div>
    </div>
  );
}
