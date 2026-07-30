"use client";

import { useState } from "react";
import { catalogApi, adminApi } from "@/lib/api";
import type { Coverage } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AdminAsyncSection } from "./AdminAsyncSection";
import { FormBanner, TextInput } from "./FormControls";
import { emptyErrors, hasErrors, required, requiredNumber, type FieldErrors } from "./formUtils";

type CoverageDraft = {
  years: string;
  sortOrder: string;
};

export function CoverageAdmin() {
  const { showToast } = useDashboard();
  const [editing, setEditing] = useState<Coverage | null>(null);
  const [draft, setDraft] = useState<CoverageDraft>({ years: "", sortOrder: "" });
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());

  const listQuery = useApiQuery("admin:coverage", () => catalogApi.coverage());
  const saveMutation = useApiMutation(
    ({ court, body }: { court: string; body: { years: string; sortOrder?: number } }) =>
      adminApi.setCoverage(court, body),
  );

  function openEdit(row: Coverage) {
    setEditing(row);
    setDraft({ years: row.years, sortOrder: String(row.sortOrder) });
    setErrors(emptyErrors());
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    const next: FieldErrors = {};
    next.years = required(draft.years, "Year span");
    next.sortOrder = requiredNumber(draft.sortOrder, "Sort order", 0);
    const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
    if (hasErrors(filtered)) {
      setErrors(filtered);
      return;
    }

    const result = await saveMutation.mutate({
      court: editing.court,
      body: {
        years: draft.years.trim(),
        sortOrder: Number(draft.sortOrder),
      },
    });
    if (!result) {
      if (saveMutation.error) setErrors({ _form: saveMutation.error });
      return;
    }

    showToast(`Coverage updated for ${editing.court}.`);
    setEditing(null);
    listQuery.refetch();
  }

  return (
    <div>
      <p className="admin-toolbar-note">
        Year spans shown in the product sidebar. Case counts are computed from the archive.
      </p>

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading coverage…"
        emptyMessage="No coverage rows configured."
        isEmpty={(items: Coverage[]) => items.length === 0}
      >
        {(items) => (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Court</th>
                  <th>Years</th>
                  <th>Count</th>
                  <th>Order</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.court}</td>
                    <td>{row.years}</td>
                    <td>{row.count}</td>
                    <td>{row.sortOrder}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminAsyncSection>

      {editing && (
        <form className="admin-form admin-inline-form" onSubmit={handleSave} noValidate>
          <h3 className="admin-form-section-title">Edit {editing.court}</h3>
          <FormBanner errors={errors} />
          <div className="admin-form-grid">
            <TextInput
              id="cov-years"
              label="Year span"
              hint='e.g. "1946 - 2026"'
              value={draft.years}
              error={errors.years}
              disabled={saveMutation.pending}
              onChange={(v) => setDraft((p) => ({ ...p, years: v }))}
            />
            <TextInput
              id="cov-sort"
              label="Sort order"
              type="number"
              value={draft.sortOrder}
              error={errors.sortOrder}
              disabled={saveMutation.pending}
              onChange={(v) => setDraft((p) => ({ ...p, sortOrder: v }))}
            />
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saveMutation.pending}>
              {saveMutation.pending ? "Saving…" : "Save coverage"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
