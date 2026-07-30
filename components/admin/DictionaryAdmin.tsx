"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { adminApi, dictionaryApi } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AdminAsyncSection } from "./AdminAsyncSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormBanner, SelectInput, TextArea, TextInput } from "./FormControls";
import { emptyErrors, hasErrors, required, type FieldErrors } from "./formUtils";

type EntryDraft = {
  id: string;
  term: string;
  kind: "term" | "maxim";
  definition: string;
  sourceCaseId: string;
  sourceCitation: string;
};

const EMPTY_DRAFT: EntryDraft = {
  id: "",
  term: "",
  kind: "term",
  definition: "",
  sourceCaseId: "",
  sourceCitation: "",
};

function entryToDraft(entry: DictionaryEntry): EntryDraft {
  return {
    id: entry.id,
    term: entry.term,
    kind: entry.kind,
    definition: entry.definition,
    sourceCaseId: entry.sourceCaseId ?? "",
    sourceCitation: entry.sourceCitation ?? "",
  };
}

export function DictionaryAdmin() {
  const { showToast } = useDashboard();
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());
  const [deleteTarget, setDeleteTarget] = useState<DictionaryEntry | null>(null);

  const listQuery = useApiQuery(`admin:dictionary:${q}`, () =>
    dictionaryApi.list({ q: q.trim() || undefined }),
  );

  const createMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.createDictionaryEntry(body),
  );
  const updateMutation = useApiMutation(
    ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateDictionaryEntry(id, body),
  );
  const deleteMutation = useApiMutation((id: string) => adminApi.deleteDictionaryEntry(id));

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!editingId) next.id = required(draft.id, "Entry ID");
    next.term = required(draft.term, "Term");
    next.definition = required(draft.definition, "Definition");
    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const body: Record<string, unknown> = {
      term: draft.term.trim(),
      kind: draft.kind,
      definition: draft.definition.trim(),
      sourceCaseId: draft.sourceCaseId.trim() || undefined,
      sourceCitation: draft.sourceCitation.trim() || undefined,
    };
    if (!editingId) body.id = draft.id.trim();

    const result = editingId
      ? await updateMutation.mutate({ id: editingId, body })
      : await createMutation.mutate(body);

    if (!result) {
      const err = editingId ? updateMutation.error : createMutation.error;
      if (err) setErrors({ _form: err });
      return;
    }

    showToast(editingId ? "Entry updated." : "Entry created.");
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowForm(false);
    setErrors(emptyErrors());
    listQuery.refetch();
  }

  function startEdit(entry: DictionaryEntry) {
    setDraft(entryToDraft(entry));
    setEditingId(entry.id);
    setShowForm(true);
    setErrors(emptyErrors());
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await deleteMutation.mutate(deleteTarget.id);
    if (ok) {
      showToast("Entry deleted.");
      setDeleteTarget(null);
      listQuery.refetch();
    }
  }

  const busy = createMutation.pending || updateMutation.pending;

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={14} aria-hidden="true" />
          <input
            className="admin-search-input"
            placeholder="Search dictionary…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setEditingId(null);
            setShowForm(true);
            setErrors(emptyErrors());
          }}
        >
          <Plus size={12} /> New entry
        </button>
      </div>

      {showForm && (
        <form className="admin-form admin-inline-form" onSubmit={handleSubmit} noValidate>
          <h3 className="admin-form-section-title">
            {editingId ? "Edit entry" : "New entry"}
          </h3>
          <FormBanner errors={errors} />
          <div className="admin-form-grid">
            {!editingId && (
              <TextInput
                id="d-id"
                label="Entry ID"
                value={draft.id}
                error={errors.id}
                disabled={busy}
                onChange={(v) => setDraft((p) => ({ ...p, id: v }))}
              />
            )}
            <TextInput
              id="d-term"
              label="Term"
              value={draft.term}
              error={errors.term}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, term: v }))}
            />
            <SelectInput
              id="d-kind"
              label="Kind"
              value={draft.kind}
              options={[
                { value: "term", label: "Term" },
                { value: "maxim", label: "Maxim" },
              ]}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, kind: v as "term" | "maxim" }))}
            />
          </div>
          <TextArea
            id="d-definition"
            label="Definition"
            value={draft.definition}
            error={errors.definition}
            rows={4}
            disabled={busy}
            onChange={(v) => setDraft((p) => ({ ...p, definition: v }))}
          />
          <div className="admin-form-grid">
            <TextInput
              id="d-sourceCaseId"
              label="Source case ID"
              value={draft.sourceCaseId}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, sourceCaseId: v }))}
            />
            <TextInput
              id="d-sourceCitation"
              label="Source citation"
              value={draft.sourceCitation}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, sourceCitation: v }))}
            />
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save entry" : "Create entry"}
            </button>
          </div>
        </form>
      )}

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading dictionary…"
        emptyMessage="No dictionary entries yet."
        isEmpty={(items: DictionaryEntry[]) => items.length === 0}
      >
        {(items) => (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Kind</th>
                  <th>Definition</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.term}</td>
                    <td>
                      <span className="admin-pill">{item.kind}</span>
                    </td>
                    <td className="admin-truncate">{item.definition}</td>
                    <td className="admin-row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm admin-btn-danger-text"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminAsyncSection>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete dictionary entry"
        body={
          deleteTarget ? (
            <>
              Remove <strong>{deleteTarget.term}</strong> from the dictionary.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
