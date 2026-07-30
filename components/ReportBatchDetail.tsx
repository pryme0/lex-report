"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { BATCH_STATUSES, reportsApi } from "@/lib/api";
import type { BatchStatus, ReportBatchDetail } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AsyncSection } from "@/components/AsyncState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormBanner, TextArea, TextInput } from "@/components/admin/FormControls";
import { emptyErrors, required, type FieldErrors } from "@/components/admin/formUtils";

/** Legal transitions from the API state machine. */
const NEXT_STATUS: Partial<Record<BatchStatus, BatchStatus[]>> = {
  Digesting: ["Headnote drafting"],
  "Headnote drafting": ["Treatment check", "Digesting"],
  "Treatment check": ["Editorial review", "Headnote drafting"],
  "Editorial review": ["Treatment check"],
};

function statusIndex(status: string): number {
  return BATCH_STATUSES.indexOf(status as BatchStatus);
}

export function ReportBatchDetail({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { showToast, openCase } = useDashboard();
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [assigneeDraft, setAssigneeDraft] = useState<string | null>(null);
  const [caseIdInput, setCaseIdInput] = useState("");
  const [caseError, setCaseError] = useState<string | undefined>();
  const [metaErrors, setMetaErrors] = useState<FieldErrors>(emptyErrors());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const batchQuery = useApiQuery(`reports:batch:${batchId}`, () => reportsApi.batch(batchId));

  const updateMutation = useApiMutation((body: { notes?: string; assignee?: string }) =>
    reportsApi.updateBatch(batchId, body),
  );
  const addCaseMutation = useApiMutation((caseId: string) =>
    reportsApi.addBatchCase(batchId, caseId),
  );
  const removeCaseMutation = useApiMutation((caseId: string) =>
    reportsApi.removeBatchCase(batchId, caseId),
  );
  const statusMutation = useApiMutation((status: string) =>
    reportsApi.setBatchStatus(batchId, status),
  );
  const publishMutation = useApiMutation(() => reportsApi.publishBatch(batchId));
  const deleteMutation = useApiMutation(() => reportsApi.deleteBatch(batchId));

  const batch = batchQuery.data;
  const notes = notesDraft ?? batch?.notes ?? "";
  const assignee = assigneeDraft ?? batch?.assignee ?? "";

  const allowedNext = useMemo(() => {
    if (!batch || batch.status === "Published") return [];
    return NEXT_STATUS[batch.status as BatchStatus] ?? [];
  }, [batch]);

  async function saveMeta() {
    const body: { notes?: string; assignee?: string } = {};
    if (notesDraft !== null) body.notes = notes.trim();
    if (assigneeDraft !== null) body.assignee = assignee.trim() || undefined;

    const result = await updateMutation.mutate(body);
    if (!result) {
      if (updateMutation.error) setMetaErrors({ _form: updateMutation.error });
      return;
    }
    showToast("Batch details saved.");
    setNotesDraft(null);
    setAssigneeDraft(null);
    setMetaErrors(emptyErrors());
    batchQuery.setData(result);
  }

  async function addCase() {
    const err = required(caseIdInput, "Case ID");
    if (err) {
      setCaseError(err);
      return;
    }
    const result = await addCaseMutation.mutate(caseIdInput.trim());
    if (!result) {
      if (addCaseMutation.error) setCaseError(addCaseMutation.error);
      return;
    }
    showToast(`Added ${caseIdInput.trim()} to batch.`);
    setCaseIdInput("");
    setCaseError(undefined);
    batchQuery.setData(result);
  }

  async function removeCase(caseId: string) {
    const result = await removeCaseMutation.mutate(caseId);
    if (result) {
      showToast(`Removed ${caseId}.`);
      batchQuery.setData(result);
    }
  }

  async function advanceStatus(status: string) {
    const result = await statusMutation.mutate(status);
    if (result) {
      showToast(`Batch moved to ${status}.`);
      batchQuery.setData(result);
    }
  }

  async function confirmPublish() {
    const result = await publishMutation.mutate();
    if (result) {
      showToast("Batch published — all judgments are now live.");
      setPublishOpen(false);
      batchQuery.setData(result);
    }
  }

  async function confirmDelete() {
    const ok = await deleteMutation.mutate();
    if (ok) {
      showToast("Batch deleted.");
      router.push("/dashboard/reports");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/dashboard/reports" className="admin-back-link">
            <ArrowLeft size={14} /> Back to reports
          </Link>
          <p className="label">Editorial batch</p>
          <h2>{batch?.topic || "Batch"}</h2>
        </div>
        {batch && batch.status !== "Published" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setPublishOpen(true)}
          >
            Publish batch
          </button>
        )}
      </div>

      <AsyncSection query={batchQuery} loadingLabel="Loading batch…">
        {(data: ReportBatchDetail) => (
          <div className="reports-batch-layout">
            <div className="reports-pipeline">
              {BATCH_STATUSES.map((step, i) => {
                const current = statusIndex(data.status);
                const idx = statusIndex(step);
                const state =
                  idx < current ? "done" : idx === current ? "current" : "pending";
                return (
                  <div key={step} className={`reports-pipeline-step reports-pipeline-${state}`}>
                    <span className="reports-pipeline-dot" aria-hidden="true" />
                    <span>{step}</span>
                    {i < BATCH_STATUSES.length - 1 && (
                      <span className="reports-pipeline-connector" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="reports-batch-meta">
              <dl className="meta-dl">
                <dt>Court</dt>
                <dd>{data.court || "—"}</dd>
                <dt>Status</dt>
                <dd>
                  <span className={`admin-pill reports-status-${data.status.replace(/\s+/g, "-").toLowerCase()}`}>
                    {data.status}
                  </span>
                </dd>
                <dt>Updated</dt>
                <dd>{new Date(data.updatedAt).toLocaleString()}</dd>
              </dl>

              {data.status !== "Published" && allowedNext.length > 0 && (
                <div className="reports-status-actions">
                  {allowedNext.map((next) => (
                    <button
                      key={next}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={statusMutation.pending}
                      onClick={() => advanceStatus(next)}
                    >
                      {statusIndex(next) > statusIndex(data.status) ? (
                        <>
                          <ChevronRight size={12} /> {next}
                        </>
                      ) : (
                        <>
                          <ChevronLeft size={12} /> Return to {next}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form admin-inline-form">
              <FormBanner errors={metaErrors} />
              <div className="admin-form-grid">
                <TextInput
                  id="batch-assignee"
                  label="Assignee"
                  value={assignee}
                  disabled={updateMutation.pending || data.status === "Published"}
                  onChange={(v) => setAssigneeDraft(v)}
                />
              </div>
              <TextArea
                id="batch-notes"
                label="Editorial notes"
                value={notes}
                rows={3}
                disabled={updateMutation.pending || data.status === "Published"}
                onChange={(v) => setNotesDraft(v)}
              />
              {data.status !== "Published" && (
                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={updateMutation.pending}
                    onClick={saveMeta}
                  >
                    {updateMutation.pending ? "Saving…" : "Save details"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm admin-btn-danger-text"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete batch
                  </button>
                </div>
              )}
            </div>

            <section className="admin-subpanel">
              <h3 className="admin-form-section-title">
                Judgments ({data.cases.length})
              </h3>
              {data.status !== "Published" && (
                <div className="reports-add-case">
                  <TextInput
                    id="batch-caseId"
                    label="Add judgment by archive ID"
                    placeholder="e.g. SC-2034"
                    value={caseIdInput}
                    error={caseError}
                    disabled={addCaseMutation.pending}
                    onChange={(v) => {
                      setCaseIdInput(v);
                      setCaseError(undefined);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={addCaseMutation.pending}
                    onClick={addCase}
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="reports-case-list">
                {data.cases.map((c) => (
                  <div key={c.id} className="reports-case-row">
                    <div>
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => openCase(c.id)}
                      >
                        {c.title}
                      </button>
                      <p className="reports-case-meta">
                        {c.id} · {c.citation}
                      </p>
                    </div>
                    {data.status !== "Published" && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm admin-btn-danger-text"
                        disabled={removeCaseMutation.pending}
                        onClick={() => removeCase(c.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </AsyncSection>

      <ConfirmDialog
        open={publishOpen}
        title="Publish batch"
        body="Publishes every judgment in this batch and closes it. This cannot be undone."
        confirmLabel="Publish"
        busy={publishMutation.pending}
        onConfirm={confirmPublish}
        onCancel={() => setPublishOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete batch"
        body="Removes the batch from the editorial queue. Judgments themselves are not deleted."
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
