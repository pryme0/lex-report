"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, legislationApi } from "@/lib/api";
import type { StatuteAmendment, StatuteDetail, StatuteSection } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AdminAsyncSection } from "./AdminAsyncSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormBanner, TextArea, TextInput } from "./FormControls";
import {
  emptyErrors,
  hasErrors,
  parseLines,
  required,
  requiredNumber,
  type FieldErrors,
} from "./formUtils";

type SectionRow = {
  id: string;
  number: string;
  heading: string;
  text: string;
  repealed: boolean;
  amendmentNote: string;
};

/** A section being composed has no id until the server assigns one. */
type SectionDraft = Omit<SectionRow, "id">;

const EMPTY_SECTION_DRAFT: SectionDraft = {
  number: "",
  heading: "",
  text: "",
  repealed: false,
  amendmentNote: "",
};

type StatuteMetaDraft = {
  id: string;
  title: string;
  shortTitle: string;
  year: string;
  longTitle: string;
  jurisdiction: string;
  chapter: string;
  commencement: string;
  repealed: boolean;
  repealedBy: string;
};

function metaFromStatute(s: StatuteDetail): StatuteMetaDraft {
  return {
    id: s.id,
    title: s.title,
    shortTitle: s.shortTitle,
    year: String(s.year),
    longTitle: s.longTitle,
    jurisdiction: s.jurisdiction,
    chapter: s.chapter ?? "",
    commencement: s.commencement ?? "",
    repealed: s.repealed,
    repealedBy: s.repealedBy ?? "",
  };
}

function sectionFromApi(s: StatuteSection): SectionRow {
  return {
    id: s.id,
    number: s.number,
    heading: s.heading,
    text: s.text,
    repealed: s.repealed,
    amendmentNote: s.amendmentNote ?? "",
  };
}

type StatuteEditorProps = {
  statuteId?: string;
  mode: "create" | "edit";
};

export function StatuteEditor({ statuteId, mode }: StatuteEditorProps) {
  const router = useRouter();
  const { showToast } = useDashboard();

  const detailQuery = useApiQuery(
    mode === "edit" && statuteId ? `admin:statute:${statuteId}` : null,
    () => legislationApi.detail(statuteId!),
  );

  const [meta, setMeta] = useState<StatuteMetaDraft>({
    id: "",
    title: "",
    shortTitle: "",
    year: "",
    longTitle: "",
    jurisdiction: "Federal",
    chapter: "",
    commencement: "",
    repealed: false,
    repealedBy: "",
  });
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [amendments, setAmendments] = useState<StatuteAmendment[]>([]);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());
  const [hydrated, setHydrated] = useState(mode === "create");

  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(EMPTY_SECTION_DRAFT);
  const [sectionErrors, setSectionErrors] = useState<FieldErrors>(emptyErrors());
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const [amendDraft, setAmendDraft] = useState({
    year: "",
    instrument: "",
    description: "",
    sectionNumbers: "",
    effectiveDate: "",
  });
  const [amendErrors, setAmendErrors] = useState<FieldErrors>(emptyErrors());
  const [deleteStatuteOpen, setDeleteStatuteOpen] = useState(false);
  const [deleteAmendmentId, setDeleteAmendmentId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  const createMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.createStatute(body),
  );
  const updateMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.updateStatute(statuteId!, body),
  );
  const deleteMutation = useApiMutation(() => adminApi.deleteStatute(statuteId!));
  const createSectionMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.createSection(statuteId!, body),
  );
  const updateSectionMutation = useApiMutation(
    ({ sectionId, body }: { sectionId: string; body: Record<string, unknown> }) =>
      adminApi.updateSection(statuteId!, sectionId, body),
  );
  const deleteSectionMutation = useApiMutation((sectionId: string) =>
    adminApi.deleteSection(statuteId!, sectionId),
  );
  const createAmendmentMutation = useApiMutation((body: Record<string, unknown>) =>
    adminApi.createAmendment(statuteId!, body),
  );
  const deleteAmendmentMutation = useApiMutation((amendmentId: string) =>
    adminApi.deleteAmendment(statuteId!, amendmentId),
  );

  // Metadata is a form the editor may be mid-way through, so it is seeded once.
  useEffect(() => {
    if (!detailQuery.data || hydrated) return;
    setMeta(metaFromStatute(detailQuery.data));
    setHydrated(true);
  }, [detailQuery.data, hydrated]);

  // Sections and amendments are saved individually, so they always mirror the server.
  useEffect(() => {
    if (!detailQuery.data) return;
    setSections(detailQuery.data.sections.map(sectionFromApi));
    setAmendments(detailQuery.data.amendments);
  }, [detailQuery.data]);

  function validateMeta(): FieldErrors {
    const next: FieldErrors = {};
    if (mode === "create") next.id = required(meta.id, "Statute ID");
    next.title = required(meta.title, "Title");
    next.shortTitle = required(meta.shortTitle, "Short title");
    next.year = requiredNumber(meta.year, "Year", 1800, 2100);
    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
  }

  async function saveMeta(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateMeta();
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const body: Record<string, unknown> = {
      title: meta.title.trim(),
      shortTitle: meta.shortTitle.trim(),
      year: Number(meta.year),
      longTitle: meta.longTitle.trim(),
      jurisdiction: meta.jurisdiction.trim(),
      chapter: meta.chapter.trim() || undefined,
      commencement: meta.commencement.trim() || undefined,
      repealed: meta.repealed,
      repealedBy: meta.repealedBy.trim() || undefined,
    };
    if (mode === "create") body.id = meta.id.trim();

    const mutation = mode === "create" ? createMutation : updateMutation;
    const result = await mutation.mutate(body);
    if (!result) {
      if (mutation.error) setErrors({ _form: mutation.error });
      return;
    }

    showToast(mode === "create" ? "Statute created." : "Statute saved.");
    if (mode === "create") {
      router.push(`/dashboard/admin/legislation/${result.id}`);
    } else {
      detailQuery.refetch();
    }
  }

  async function confirmDeleteStatute() {
    const ok = await deleteMutation.mutate();
    if (ok) {
      showToast("Statute deleted.");
      router.push("/dashboard/admin/legislation");
    }
  }

  function validateSectionDraft(): FieldErrors {
    const next: FieldErrors = {};
    next.number = required(sectionDraft.number, "Section number");
    next.heading = required(sectionDraft.heading, "Heading");
    next.text = required(sectionDraft.text, "Text");
    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
  }

  async function saveSection() {
    const nextErrors = validateSectionDraft();
    if (hasErrors(nextErrors)) {
      setSectionErrors(nextErrors);
      return;
    }

    const body = {
      number: sectionDraft.number.trim(),
      heading: sectionDraft.heading.trim(),
      text: sectionDraft.text.trim(),
      repealed: sectionDraft.repealed,
      amendmentNote: sectionDraft.amendmentNote.trim() || undefined,
    };

    if (editingSectionId) {
      const result = await updateSectionMutation.mutate({
        sectionId: editingSectionId,
        body,
      });
      if (!result) {
        if (updateSectionMutation.error) setSectionErrors({ _form: updateSectionMutation.error });
        return;
      }
      showToast("Section updated.");
    } else {
      const created = await createSectionMutation.mutate(body);
      if (!created) {
        if (createSectionMutation.error) setSectionErrors({ _form: createSectionMutation.error });
        return;
      }
      showToast("Section added.");
    }

    setSectionDraft(EMPTY_SECTION_DRAFT);
    setEditingSectionId(null);
    setSectionErrors(emptyErrors());
    detailQuery.refetch();
  }

  async function confirmDeleteSection() {
    if (!deleteSectionId) return;
    const ok = await deleteSectionMutation.mutate(deleteSectionId);
    if (ok) {
      showToast("Section deleted.");
      setDeleteSectionId(null);
      detailQuery.refetch();
    }
  }

  async function saveAmendment() {
    const next: FieldErrors = {};
    next.year = requiredNumber(amendDraft.year, "Year", 1800, 2100);
    next.instrument = required(amendDraft.instrument, "Instrument");
    next.description = required(amendDraft.description, "Description");
    const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
    if (hasErrors(filtered)) {
      setAmendErrors(filtered);
      return;
    }

    const result = await createAmendmentMutation.mutate({
      year: Number(amendDraft.year),
      instrument: amendDraft.instrument.trim(),
      description: amendDraft.description.trim(),
      sectionNumbers: parseLines(amendDraft.sectionNumbers.replace(/,/g, "\n")),
      effectiveDate: amendDraft.effectiveDate.trim() || undefined,
    });
    if (!result) {
      if (createAmendmentMutation.error) setAmendErrors({ _form: createAmendmentMutation.error });
      return;
    }

    showToast("Amendment recorded.");
    setAmendDraft({ year: "", instrument: "", description: "", sectionNumbers: "", effectiveDate: "" });
    setAmendErrors(emptyErrors());
    detailQuery.refetch();
  }

  async function confirmDeleteAmendment() {
    if (!deleteAmendmentId) return;
    const ok = await deleteAmendmentMutation.mutate(deleteAmendmentId);
    if (ok) {
      showToast("Amendment removed.");
      setDeleteAmendmentId(null);
      detailQuery.refetch();
    }
  }

  const busy =
    createMutation.pending ||
    updateMutation.pending ||
    createSectionMutation.pending ||
    updateSectionMutation.pending;

  if (mode === "edit" && !hydrated) {
    return (
      <AdminAsyncSection query={detailQuery} loadingLabel="Loading statute…">
        {() => null}
      </AdminAsyncSection>
    );
  }

  return (
    <div className="admin-statute-editor">
      <form className="admin-form" onSubmit={saveMeta} noValidate>
        <FormBanner errors={errors} />
        <div className="admin-form-grid">
          {mode === "create" && (
            <TextInput
              id="s-id"
              label="Statute ID"
              value={meta.id}
              error={errors.id}
              disabled={busy}
              onChange={(v) => setMeta((p) => ({ ...p, id: v }))}
            />
          )}
          <TextInput
            id="s-title"
            label="Title"
            value={meta.title}
            error={errors.title}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, title: v }))}
          />
          <TextInput
            id="s-shortTitle"
            label="Short title"
            value={meta.shortTitle}
            error={errors.shortTitle}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, shortTitle: v }))}
          />
          <TextInput
            id="s-year"
            label="Year"
            type="number"
            value={meta.year}
            error={errors.year}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, year: v }))}
          />
          <TextInput
            id="s-jurisdiction"
            label="Jurisdiction"
            value={meta.jurisdiction}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, jurisdiction: v }))}
          />
          <TextInput
            id="s-chapter"
            label="Chapter"
            value={meta.chapter}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, chapter: v }))}
          />
          <TextInput
            id="s-commencement"
            label="Commencement"
            value={meta.commencement}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, commencement: v }))}
          />
        </div>
        <TextArea
          id="s-longTitle"
          label="Long title"
          value={meta.longTitle}
          rows={2}
          disabled={busy}
          onChange={(v) => setMeta((p) => ({ ...p, longTitle: v }))}
        />
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={meta.repealed}
            disabled={busy}
            onChange={(e) => setMeta((p) => ({ ...p, repealed: e.target.checked }))}
          />
          Repealed
        </label>
        {meta.repealed && (
          <TextInput
            id="s-repealedBy"
            label="Repealed by"
            value={meta.repealedBy}
            disabled={busy}
            onChange={(v) => setMeta((p) => ({ ...p, repealedBy: v }))}
          />
        )}
        <div className="admin-form-actions">
          {mode === "edit" && (
            <button
              type="button"
              className="btn btn-ghost btn-sm admin-btn-danger-text"
              onClick={() => setDeleteStatuteOpen(true)}
            >
              Delete statute
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create statute" : "Save metadata"}
          </button>
        </div>
      </form>

      {mode === "edit" && statuteId && (
        <>
          <section className="admin-subpanel">
            <h3 className="admin-form-section-title">Sections</h3>
            <div className="admin-table-wrap">
              <table className="admin-table admin-table-compact">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Heading</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.id ?? s.number}>
                      <td className="admin-mono">{s.number}</td>
                      <td>{s.heading}</td>
                      <td>{s.repealed ? "Repealed" : "In force"}</td>
                      <td className="admin-row-actions">
                        {s.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setSectionDraft(s);
                                setEditingSectionId(s.id!);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm admin-btn-danger-text"
                              onClick={() => setDeleteSectionId(s.id!)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="admin-muted-note">Loading…</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-inline-form">
              <FormBanner errors={sectionErrors} />
              <div className="admin-form-grid">
                <TextInput
                  id="sec-number"
                  label="Number"
                  value={sectionDraft.number}
                  error={sectionErrors.number}
                  disabled={createSectionMutation.pending || updateSectionMutation.pending}
                  onChange={(v) => setSectionDraft((p) => ({ ...p, number: v }))}
                />
                <TextInput
                  id="sec-heading"
                  label="Heading"
                  value={sectionDraft.heading}
                  error={sectionErrors.heading}
                  disabled={createSectionMutation.pending || updateSectionMutation.pending}
                  onChange={(v) => setSectionDraft((p) => ({ ...p, heading: v }))}
                />
              </div>
              <TextArea
                id="sec-text"
                label="Text"
                value={sectionDraft.text}
                error={sectionErrors.text}
                rows={4}
                disabled={createSectionMutation.pending || updateSectionMutation.pending}
                onChange={(v) => setSectionDraft((p) => ({ ...p, text: v }))}
              />
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={sectionDraft.repealed}
                  onChange={(e) => setSectionDraft((p) => ({ ...p, repealed: e.target.checked }))}
                />
                Repealed
              </label>
              <div className="admin-form-actions">
                {editingSectionId && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingSectionId(null);
                      setSectionDraft(EMPTY_SECTION_DRAFT);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={createSectionMutation.pending || updateSectionMutation.pending}
                  onClick={saveSection}
                >
                  {editingSectionId ? "Update section" : "Add section"}
                </button>
              </div>
            </div>
          </section>

          <section className="admin-subpanel">
            <h3 className="admin-form-section-title">Amendments</h3>
            {amendments.length > 0 && (
              <div className="admin-table-wrap">
                <table className="admin-table admin-table-compact">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Instrument</th>
                      <th>Sections</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {amendments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.year}</td>
                        <td>{a.instrument}</td>
                        <td>{a.sectionNumbers.join(", ")}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm admin-btn-danger-text"
                            onClick={() => setDeleteAmendmentId(a.id)}
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

            <div className="admin-inline-form">
              <FormBanner errors={amendErrors} />
              <div className="admin-form-grid">
                <TextInput
                  id="am-year"
                  label="Year"
                  type="number"
                  value={amendDraft.year}
                  error={amendErrors.year}
                  onChange={(v) => setAmendDraft((p) => ({ ...p, year: v }))}
                />
                <TextInput
                  id="am-instrument"
                  label="Instrument"
                  value={amendDraft.instrument}
                  error={amendErrors.instrument}
                  onChange={(v) => setAmendDraft((p) => ({ ...p, instrument: v }))}
                />
              </div>
              <TextArea
                id="am-desc"
                label="Description"
                value={amendDraft.description}
                error={amendErrors.description}
                rows={2}
                onChange={(v) => setAmendDraft((p) => ({ ...p, description: v }))}
              />
              <TextArea
                id="am-sections"
                label="Affected sections"
                hint="One section number per line"
                value={amendDraft.sectionNumbers}
                rows={2}
                onChange={(v) => setAmendDraft((p) => ({ ...p, sectionNumbers: v }))}
              />
              <TextInput
                id="am-effective"
                label="Effective date"
                value={amendDraft.effectiveDate}
                onChange={(v) => setAmendDraft((p) => ({ ...p, effectiveDate: v }))}
              />
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={createAmendmentMutation.pending}
                  onClick={saveAmendment}
                >
                  Add amendment
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <ConfirmDialog
        open={deleteStatuteOpen}
        title="Delete statute"
        body="Removes the Act and all its sections from the legislation library."
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.pending}
        onConfirm={confirmDeleteStatute}
        onCancel={() => setDeleteStatuteOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(deleteSectionId)}
        title="Delete section"
        body="Removes this section from the statute."
        confirmLabel="Delete"
        destructive
        busy={deleteSectionMutation.pending}
        onConfirm={confirmDeleteSection}
        onCancel={() => setDeleteSectionId(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteAmendmentId)}
        title="Delete amendment"
        body="Removes this amendment record."
        confirmLabel="Delete"
        destructive
        busy={deleteAmendmentMutation.pending}
        onConfirm={confirmDeleteAmendment}
        onCancel={() => setDeleteAmendmentId(null)}
      />
    </div>
  );
}
