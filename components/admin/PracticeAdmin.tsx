"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { adminApi, practiceApi } from "@/lib/api";
import type { CourtForm, PracticeInstrument, PracticeProvision } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AdminAsyncSection } from "./AdminAsyncSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormBanner, SelectInput, TextArea, TextInput } from "./FormControls";
import { emptyErrors, hasErrors, required, requiredNumber, type FieldErrors } from "./formUtils";

type Tab = "instruments" | "forms";

type InstrumentDraft = {
  id: string;
  title: string;
  shortTitle: string;
  kind: "rules" | "practice-direction";
  court: string;
  jurisdiction: string;
  year: string;
  description: string;
};

/** Position in the list is the ordering, so no separate sort key is edited. */
type ProvisionDraft = {
  number: string;
  heading: string;
  text: string;
};

type FormDraft = {
  id: string;
  code: string;
  title: string;
  description: string;
  court: string;
  jurisdiction: string;
  instrumentId: string;
  content: string;
};

const EMPTY_INSTRUMENT: InstrumentDraft = {
  id: "",
  title: "",
  shortTitle: "",
  kind: "rules",
  court: "",
  jurisdiction: "Federal",
  year: "",
  description: "",
};

const EMPTY_PROVISION: ProvisionDraft = {
  number: "",
  heading: "",
  text: "",
};

const EMPTY_FORM: FormDraft = {
  id: "",
  code: "",
  title: "",
  description: "",
  court: "",
  jurisdiction: "Federal",
  instrumentId: "",
  content: "",
};

export function PracticeAdmin() {
  const [tab, setTab] = useState<Tab>("instruments");

  return (
    <div>
      <div className="admin-filter-tabs" role="tablist" aria-label="Practice corpus">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "instruments"}
          className={`admin-filter-tab${tab === "instruments" ? " active" : ""}`}
          onClick={() => setTab("instruments")}
        >
          Instruments
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "forms"}
          className={`admin-filter-tab${tab === "forms" ? " active" : ""}`}
          onClick={() => setTab("forms")}
        >
          Court forms
        </button>
      </div>
      {tab === "instruments" ? <InstrumentsPanel /> : <FormsPanel />}
    </div>
  );
}

function InstrumentsPanel() {
  const { showToast } = useDashboard();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<InstrumentDraft>(EMPTY_INSTRUMENT);
  const [provisions, setProvisions] = useState<ProvisionDraft[]>([]);
  const [provisionDraft, setProvisionDraft] = useState<ProvisionDraft>(EMPTY_PROVISION);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadedProvisions, setLoadedProvisions] = useState<PracticeProvision[]>([]);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());
  const [deleteTarget, setDeleteTarget] = useState<PracticeInstrument | null>(null);

  const listQuery = useApiQuery("admin:instruments", () => practiceApi.instruments());

  const createMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.createInstrument(body),
  );
  const updateMutation = useApiMutation(
    ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateInstrument(id, body),
  );
  const deleteMutation = useApiMutation((id: string) => adminApi.deleteInstrument(id));
  const detailMutation = useApiMutation((id: string) => practiceApi.instrument(id));

  function validateInstrument(): FieldErrors {
    const next: FieldErrors = {};
    if (!editingId) next.id = required(draft.id, "Instrument ID");
    next.title = required(draft.title, "Title");
    next.shortTitle = required(draft.shortTitle, "Short title");
    next.court = required(draft.court, "Court");
    next.year = requiredNumber(draft.year, "Year", 1800, 2100);
    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
  }

  async function startEdit(item: PracticeInstrument) {
    const detail = await detailMutation.mutate(item.id);
    if (!detail) return;
    setDraft({
      id: detail.id,
      title: detail.title,
      shortTitle: detail.shortTitle,
      kind: detail.kind,
      court: detail.court,
      jurisdiction: detail.jurisdiction,
      year: String(detail.year),
      description: detail.description,
    });
    setLoadedProvisions(detail.provisions);
    setProvisions(
      detail.provisions.map((p) => ({
        number: p.number,
        heading: p.heading,
        text: p.text,
      })),
    );
    setEditingId(item.id);
    setShowForm(true);
    setErrors(emptyErrors());
  }

  function moveProvision(index: number, delta: number) {
    setProvisions((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addProvisionToList() {
    const next: FieldErrors = {};
    next.number = required(provisionDraft.number, "Number");
    next.heading = required(provisionDraft.heading, "Heading");
    next.text = required(provisionDraft.text, "Text");
    const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
    if (hasErrors(filtered)) {
      setErrors(filtered);
      return;
    }
    setProvisions((prev) => [...prev, { ...provisionDraft }]);
    setProvisionDraft(EMPTY_PROVISION);
    setErrors(emptyErrors());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateInstrument();
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const body: Record<string, unknown> = {
      title: draft.title.trim(),
      shortTitle: draft.shortTitle.trim(),
      kind: draft.kind,
      court: draft.court.trim(),
      jurisdiction: draft.jurisdiction.trim(),
      year: Number(draft.year),
      description: draft.description.trim(),
    };
    const provisionPayload = provisions.map((p, index) => ({
      number: p.number.trim(),
      heading: p.heading.trim(),
      text: p.text.trim(),
      sortOrder: index,
    }));
    if (!editingId) {
      body.id = draft.id.trim();
      body.provisions = provisionPayload;
    } else if (provisions.length > 0) {
      body.provisions = provisionPayload;
    }

    const result = editingId
      ? await updateMutation.mutate({ id: editingId, body })
      : await createMutation.mutate(body);

    if (!result) {
      const err = editingId ? updateMutation.error : createMutation.error;
      if (err) setErrors({ _form: err });
      return;
    }

    showToast(editingId ? "Instrument updated." : "Instrument created.");
    setShowForm(false);
    setEditingId(null);
    setDraft(EMPTY_INSTRUMENT);
    setProvisions([]);
    listQuery.refetch();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await deleteMutation.mutate(deleteTarget.id);
    if (ok) {
      showToast("Instrument deleted.");
      setDeleteTarget(null);
      listQuery.refetch();
    }
  }

  const busy = createMutation.pending || updateMutation.pending;

  return (
    <div>
      <div className="admin-toolbar">
        <p className="admin-toolbar-note">Court rules and practice directions.</p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setDraft(EMPTY_INSTRUMENT);
            setProvisions([]);
            setEditingId(null);
            setShowForm(true);
            setErrors(emptyErrors());
          }}
        >
          <Plus size={12} /> New instrument
        </button>
      </div>

      {showForm && (
        <form className="admin-form admin-inline-form" onSubmit={handleSubmit} noValidate>
          <h3 className="admin-form-section-title">
            {editingId ? "Edit instrument" : "New instrument"}
          </h3>
          <FormBanner errors={errors} />
          <div className="admin-form-grid">
            {!editingId && (
              <TextInput
                id="pi-id"
                label="Instrument ID"
                value={draft.id}
                error={errors.id}
                disabled={busy}
                onChange={(v) => setDraft((p) => ({ ...p, id: v }))}
              />
            )}
            <TextInput
              id="pi-title"
              label="Title"
              value={draft.title}
              error={errors.title}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, title: v }))}
            />
            <TextInput
              id="pi-shortTitle"
              label="Short title"
              value={draft.shortTitle}
              error={errors.shortTitle}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, shortTitle: v }))}
            />
            <SelectInput
              id="pi-kind"
              label="Kind"
              value={draft.kind}
              options={[
                { value: "rules", label: "Rules" },
                { value: "practice-direction", label: "Practice direction" },
              ]}
              disabled={busy}
              onChange={(v) =>
                setDraft((p) => ({ ...p, kind: v as "rules" | "practice-direction" }))
              }
            />
            <TextInput
              id="pi-court"
              label="Court"
              value={draft.court}
              error={errors.court}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, court: v }))}
            />
            <TextInput
              id="pi-year"
              label="Year"
              type="number"
              value={draft.year}
              error={errors.year}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, year: v }))}
            />
            <TextInput
              id="pi-jurisdiction"
              label="Jurisdiction"
              value={draft.jurisdiction}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, jurisdiction: v }))}
            />
          </div>
          <TextArea
            id="pi-description"
            label="Description"
            value={draft.description}
            rows={2}
            disabled={busy}
            onChange={(v) => setDraft((p) => ({ ...p, description: v }))}
          />

          <div className="admin-subpanel">
            <h4 className="admin-form-section-title">Provisions</h4>
            {provisions.length > 0 && (
              <ul className="admin-provision-list">
                {provisions.map((p, i) => (
                  <li key={`${p.number}-${i}`}>
                    <strong>{p.number}</strong> — {p.heading}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={i === 0}
                      aria-label={`Move ${p.number} earlier`}
                      onClick={() => moveProvision(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={i === provisions.length - 1}
                      aria-label={`Move ${p.number} later`}
                      onClick={() => moveProvision(i, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm admin-btn-danger-text"
                      onClick={() => setProvisions((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {editingId && loadedProvisions.length > 0 && provisions.length === 0 && (
              <p className="admin-muted-note">
                Saving metadata without provisions leaves existing rules unchanged. Add provisions
                below to replace the full list.
              </p>
            )}
            <div className="admin-form-grid">
              <TextInput
                id="pv-number"
                label="Number"
                value={provisionDraft.number}
                error={errors.number}
                onChange={(v) => setProvisionDraft((p) => ({ ...p, number: v }))}
              />
              <TextInput
                id="pv-heading"
                label="Heading"
                value={provisionDraft.heading}
                error={errors.heading}
                onChange={(v) => setProvisionDraft((p) => ({ ...p, heading: v }))}
              />
            </div>
            <TextArea
              id="pv-text"
              label="Text"
              value={provisionDraft.text}
              error={errors.text}
              rows={3}
              onChange={(v) => setProvisionDraft((p) => ({ ...p, text: v }))}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addProvisionToList}>
              Add provision to list
            </button>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save instrument" : "Create instrument"}
            </button>
          </div>
        </form>
      )}

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading instruments…"
        emptyMessage="No practice instruments yet."
        isEmpty={(items: PracticeInstrument[]) => items.length === 0}
      >
        {(items) => (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Court</th>
                  <th>Kind</th>
                  <th>Year</th>
                  <th>Provisions</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.shortTitle}</td>
                    <td>{item.court}</td>
                    <td>{item.kind}</td>
                    <td>{item.year}</td>
                    <td>{item.provisionCount}</td>
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
        title="Delete instrument"
        body={
          deleteTarget ? (
            <>Remove {deleteTarget.shortTitle} and all its provisions.</>
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

function FormsPanel() {
  const { showToast } = useDashboard();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());
  const [deleteTarget, setDeleteTarget] = useState<CourtForm | null>(null);

  const listQuery = useApiQuery("admin:forms", () => practiceApi.forms());
  const createMutation = useApiMutation((body: Record<string, unknown>) => adminApi.createForm(body));
  const updateMutation = useApiMutation(
    ({ id, body }: { id: string; body: Record<string, unknown> }) => adminApi.updateForm(id, body),
  );
  const deleteMutation = useApiMutation((id: string) => adminApi.deleteForm(id));
  const detailMutation = useApiMutation((id: string) => practiceApi.form(id));

  async function startEdit(item: CourtForm) {
    const detail = await detailMutation.mutate(item.id);
    if (!detail) return;
    setDraft({
      id: detail.id,
      code: detail.code,
      title: detail.title,
      description: detail.description,
      court: detail.court,
      jurisdiction: detail.jurisdiction,
      instrumentId: detail.instrumentId ?? "",
      content: detail.content,
    });
    setEditingId(item.id);
    setShowForm(true);
    setErrors(emptyErrors());
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!editingId) next.id = required(draft.id, "Form ID");
    next.code = required(draft.code, "Code");
    next.title = required(draft.title, "Title");
    next.court = required(draft.court, "Court");
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
      code: draft.code.trim(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      court: draft.court.trim(),
      jurisdiction: draft.jurisdiction.trim(),
      instrumentId: draft.instrumentId.trim() || undefined,
      content: draft.content.trim(),
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

    showToast(editingId ? "Form updated." : "Form created.");
    setShowForm(false);
    setEditingId(null);
    setDraft(EMPTY_FORM);
    listQuery.refetch();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await deleteMutation.mutate(deleteTarget.id);
    if (ok) {
      showToast("Form deleted.");
      setDeleteTarget(null);
      listQuery.refetch();
    }
  }

  const busy = createMutation.pending || updateMutation.pending;

  return (
    <div>
      <div className="admin-toolbar">
        <p className="admin-toolbar-note">Court form templates.</p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setDraft(EMPTY_FORM);
            setEditingId(null);
            setShowForm(true);
            setErrors(emptyErrors());
          }}
        >
          <Plus size={12} /> New form
        </button>
      </div>

      {showForm && (
        <form className="admin-form admin-inline-form" onSubmit={handleSubmit} noValidate>
          <h3 className="admin-form-section-title">{editingId ? "Edit form" : "New form"}</h3>
          <FormBanner errors={errors} />
          <div className="admin-form-grid">
            {!editingId && (
              <TextInput
                id="f-id"
                label="Form ID"
                value={draft.id}
                error={errors.id}
                disabled={busy}
                onChange={(v) => setDraft((p) => ({ ...p, id: v }))}
              />
            )}
            <TextInput
              id="f-code"
              label="Code"
              value={draft.code}
              error={errors.code}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, code: v }))}
            />
            <TextInput
              id="f-title"
              label="Title"
              value={draft.title}
              error={errors.title}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, title: v }))}
            />
            <TextInput
              id="f-court"
              label="Court"
              value={draft.court}
              error={errors.court}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, court: v }))}
            />
            <TextInput
              id="f-jurisdiction"
              label="Jurisdiction"
              value={draft.jurisdiction}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, jurisdiction: v }))}
            />
            <TextInput
              id="f-instrumentId"
              label="Parent instrument ID"
              value={draft.instrumentId}
              disabled={busy}
              onChange={(v) => setDraft((p) => ({ ...p, instrumentId: v }))}
            />
          </div>
          <TextArea
            id="f-description"
            label="Description"
            value={draft.description}
            rows={2}
            disabled={busy}
            onChange={(v) => setDraft((p) => ({ ...p, description: v }))}
          />
          <TextArea
            id="f-content"
            label="Form content"
            value={draft.content}
            rows={8}
            disabled={busy}
            onChange={(v) => setDraft((p) => ({ ...p, content: v }))}
          />
          <div className="admin-form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save form" : "Create form"}
            </button>
          </div>
        </form>
      )}

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading forms…"
        emptyMessage="No court forms yet."
        isEmpty={(items: CourtForm[]) => items.length === 0}
      >
        {(items) => (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Court</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-mono">{item.code}</td>
                    <td>{item.title}</td>
                    <td>{item.court}</td>
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
        title="Delete court form"
        body={deleteTarget ? <>Remove {deleteTarget.title}.</> : null}
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
