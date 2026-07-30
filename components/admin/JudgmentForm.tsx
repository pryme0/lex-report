"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import type { AdminCase } from "@/lib/api";
import { useApiMutation } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import type { Treatment } from "@/lib/types";
import { FormBanner, SelectInput, TextArea, TextInput } from "./FormControls";
import {
  emptyErrors,
  hasErrors,
  joinLines,
  parseLines,
  required,
  requiredNumber,
  type FieldErrors,
} from "./formUtils";

const TREATMENTS: Treatment[] = [
  "Followed",
  "Applied",
  "Approved",
  "Considered",
  "Explained",
  "Referred to",
  "Distinguished",
  "Doubted",
  "Questioned",
  "Not followed",
  "Overruled in part",
  "Overruled",
  "Departed from",
  "Per incuriam",
];

export type JudgmentDraft = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: string;
  judges: string;
  area: string;
  digestArea: string;
  posture: string;
  ratio: string;
  treatment: Treatment;
  strength: string;
  readTime: string;
  facts: string;
  holding: string;
  fullText: string;
  jurisdiction: string;
  neutralCitation: string;
  suitNo: string;
  appellant: string;
  respondent: string;
  reportSeries: string;
  reportVolume: string;
  reportPart: string;
  reportPage: string;
  decisionDate: string;
  issues: string;
  verified: boolean;
};

export function adminCaseToDraft(item: AdminCase): JudgmentDraft {
  return {
    id: item.id,
    title: item.title,
    citation: item.citation,
    court: item.court,
    year: String(item.year),
    judges: item.judges,
    area: item.area,
    digestArea: item.digestArea,
    posture: item.posture,
    ratio: item.ratio,
    treatment: item.treatment,
    strength: String(item.strength),
    readTime: item.readTime,
    facts: item.facts,
    holding: item.holding,
    fullText: item.fullText,
    jurisdiction: item.jurisdiction,
    neutralCitation: item.neutralCitation ?? "",
    suitNo: item.suitNo ?? "",
    appellant: item.appellant ?? "",
    respondent: item.respondent ?? "",
    reportSeries: item.report?.series ?? "",
    reportVolume: item.report?.volume != null ? String(item.report.volume) : "",
    reportPart: item.report?.part != null ? String(item.report.part) : "",
    reportPage: item.report?.page != null ? String(item.report.page) : "",
    decisionDate: "",
    issues: joinLines(item.issues),
    verified: item.verified,
  };
}

export const EMPTY_JUDGMENT_DRAFT: JudgmentDraft = {
  id: "",
  title: "",
  citation: "",
  court: "",
  year: "",
  judges: "",
  area: "",
  digestArea: "",
  posture: "",
  ratio: "",
  treatment: "Followed",
  strength: "50",
  readTime: "10 min",
  facts: "",
  holding: "",
  fullText: "",
  jurisdiction: "Federal",
  neutralCitation: "",
  suitNo: "",
  appellant: "",
  respondent: "",
  reportSeries: "",
  reportVolume: "",
  reportPart: "",
  reportPage: "",
  decisionDate: "",
  issues: "",
  verified: false,
};

function validateDraft(draft: JudgmentDraft, isCreate: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (isCreate) errors.id = required(draft.id, "Archive ID");
  errors.title = required(draft.title, "Title");
  errors.citation = required(draft.citation, "Citation");
  errors.court = required(draft.court, "Court");
  errors.year = requiredNumber(draft.year, "Year", 1800, 2100);
  errors.judges = required(draft.judges, "Judges");
  errors.jurisdiction = required(draft.jurisdiction, "Jurisdiction");
  errors.strength = requiredNumber(draft.strength, "Strength", 0, 100);
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors;
}

function draftToPayload(draft: JudgmentDraft, isCreate: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: draft.title.trim(),
    citation: draft.citation.trim(),
    court: draft.court.trim(),
    year: Number(draft.year),
    judges: draft.judges.trim(),
    area: draft.area.trim(),
    digestArea: draft.digestArea.trim(),
    posture: draft.posture.trim(),
    ratio: draft.ratio.trim(),
    treatment: draft.treatment,
    strength: Number(draft.strength),
    readTime: draft.readTime.trim() || "10 min",
    facts: draft.facts.trim(),
    holding: draft.holding.trim(),
    fullText: draft.fullText.trim(),
    jurisdiction: draft.jurisdiction.trim(),
    neutralCitation: draft.neutralCitation.trim() || undefined,
    suitNo: draft.suitNo.trim() || undefined,
    appellant: draft.appellant.trim() || undefined,
    respondent: draft.respondent.trim() || undefined,
    reportSeries: draft.reportSeries.trim() || undefined,
    reportVolume: draft.reportVolume.trim() ? Number(draft.reportVolume) : undefined,
    reportPart: draft.reportPart.trim() ? Number(draft.reportPart) : undefined,
    reportPage: draft.reportPage.trim() ? Number(draft.reportPage) : undefined,
    decisionDate: draft.decisionDate.trim() || undefined,
    issues: parseLines(draft.issues),
    verified: draft.verified,
  };
  if (isCreate) body.id = draft.id.trim();
  return body;
}

type JudgmentFormProps = {
  mode: "create" | "edit";
  initial: JudgmentDraft;
  published?: boolean;
  onSaved?: (item: AdminCase) => void;
};

export function JudgmentForm({ mode, initial, published, onSaved }: JudgmentFormProps) {
  const router = useRouter();
  const { showToast } = useDashboard();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());

  const saveMutation = useApiMutation((body: Record<string, unknown>) =>
    mode === "create"
      ? adminApi.createCase(body)
      : adminApi.updateCase(initial.id, body),
  );

  const publishMutation = useApiMutation(() => adminApi.publishCase(initial.id));
  const unpublishMutation = useApiMutation(() => adminApi.unpublishCase(initial.id));

  const treatmentOptions = useMemo(
    () => TREATMENTS.map((t) => ({ value: t, label: t })),
    [],
  );

  function update<K extends keyof JudgmentDraft>(key: K, value: JudgmentDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, _form: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateDraft(draft, mode === "create");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const payload = draftToPayload(draft, mode === "create");
    const result = await saveMutation.mutate(payload);
    if (!result) {
      if (saveMutation.error) {
        setErrors({ _form: saveMutation.error });
      }
      return;
    }

    showToast(mode === "create" ? "Judgment created." : "Judgment saved.");
    onSaved?.(result);
    if (mode === "create") router.push(`/dashboard/admin/judgments/${result.id}`);
  }

  async function togglePublish() {
    const mutation = published ? unpublishMutation : publishMutation;
    const result = await mutation.mutate();
    if (result) {
      showToast(published ? "Judgment unpublished." : "Judgment published.");
      onSaved?.(result);
    }
  }

  const busy = saveMutation.pending || publishMutation.pending || unpublishMutation.pending;

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <FormBanner errors={errors} />

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Identity</h3>
        <div className="admin-form-grid">
          {mode === "create" && (
            <TextInput
              id="j-id"
              label="Archive ID"
              hint="Stable id, e.g. SC-2102"
              value={draft.id}
              error={errors.id}
              disabled={busy}
              onChange={(v) => update("id", v)}
            />
          )}
          <TextInput
            id="j-title"
            label="Title"
            value={draft.title}
            error={errors.title}
            disabled={busy}
            onChange={(v) => update("title", v)}
          />
          <TextInput
            id="j-suitNo"
            label="Suit number"
            value={draft.suitNo}
            error={errors.suitNo}
            disabled={busy}
            onChange={(v) => update("suitNo", v)}
          />
          <TextInput
            id="j-appellant"
            label="Appellant"
            value={draft.appellant}
            disabled={busy}
            onChange={(v) => update("appellant", v)}
          />
          <TextInput
            id="j-respondent"
            label="Respondent"
            value={draft.respondent}
            disabled={busy}
            onChange={(v) => update("respondent", v)}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Court & citation</h3>
        <div className="admin-form-grid">
          <TextInput
            id="j-court"
            label="Court"
            value={draft.court}
            error={errors.court}
            disabled={busy}
            onChange={(v) => update("court", v)}
          />
          <TextInput
            id="j-year"
            label="Year"
            type="number"
            value={draft.year}
            error={errors.year}
            disabled={busy}
            onChange={(v) => update("year", v)}
          />
          <TextInput
            id="j-judges"
            label="Judges"
            value={draft.judges}
            error={errors.judges}
            disabled={busy}
            onChange={(v) => update("judges", v)}
          />
          <TextInput
            id="j-citation"
            label="Citation"
            value={draft.citation}
            error={errors.citation}
            disabled={busy}
            onChange={(v) => update("citation", v)}
          />
          <TextInput
            id="j-neutralCitation"
            label="Neutral citation"
            value={draft.neutralCitation}
            disabled={busy}
            onChange={(v) => update("neutralCitation", v)}
          />
          <TextInput
            id="j-jurisdiction"
            label="Jurisdiction"
            value={draft.jurisdiction}
            error={errors.jurisdiction}
            disabled={busy}
            onChange={(v) => update("jurisdiction", v)}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Report placement</h3>
        <div className="admin-form-grid">
          <TextInput
            id="j-reportSeries"
            label="Series"
            placeholder="LRR"
            value={draft.reportSeries}
            disabled={busy}
            onChange={(v) => update("reportSeries", v)}
          />
          <TextInput
            id="j-reportVolume"
            label="Volume"
            type="number"
            value={draft.reportVolume}
            disabled={busy}
            onChange={(v) => update("reportVolume", v)}
          />
          <TextInput
            id="j-reportPart"
            label="Part"
            type="number"
            value={draft.reportPart}
            disabled={busy}
            onChange={(v) => update("reportPart", v)}
          />
          <TextInput
            id="j-reportPage"
            label="Page"
            type="number"
            value={draft.reportPage}
            disabled={busy}
            onChange={(v) => update("reportPage", v)}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Classification</h3>
        <div className="admin-form-grid">
          <TextInput
            id="j-area"
            label="Practice area"
            value={draft.area}
            disabled={busy}
            onChange={(v) => update("area", v)}
          />
          <TextInput
            id="j-digestArea"
            label="Digest area"
            hint='Format: "Area → Sub-area"'
            value={draft.digestArea}
            disabled={busy}
            onChange={(v) => update("digestArea", v)}
          />
          <TextInput
            id="j-posture"
            label="Posture"
            value={draft.posture}
            disabled={busy}
            onChange={(v) => update("posture", v)}
          />
          <SelectInput
            id="j-treatment"
            label="Treatment"
            value={draft.treatment}
            options={treatmentOptions}
            disabled={busy}
            onChange={(v) => update("treatment", v as Treatment)}
          />
          <TextInput
            id="j-strength"
            label="Strength"
            type="number"
            value={draft.strength}
            error={errors.strength}
            disabled={busy}
            onChange={(v) => update("strength", v)}
          />
          <TextInput
            id="j-readTime"
            label="Read time"
            value={draft.readTime}
            disabled={busy}
            onChange={(v) => update("readTime", v)}
          />
        </div>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.verified}
            disabled={busy}
            onChange={(e) => update("verified", e.target.checked)}
          />
          Verified against certified judgment
        </label>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Headnote</h3>
        <TextArea
          id="j-issues"
          label="Issues for determination"
          hint="One issue per line"
          value={draft.issues}
          rows={3}
          disabled={busy}
          onChange={(v) => update("issues", v)}
        />
        <TextArea
          id="j-facts"
          label="Facts"
          value={draft.facts}
          rows={4}
          disabled={busy}
          onChange={(v) => update("facts", v)}
        />
        <TextArea
          id="j-holding"
          label="Holding"
          value={draft.holding}
          rows={3}
          disabled={busy}
          onChange={(v) => update("holding", v)}
        />
        <TextArea
          id="j-ratio"
          label="Ratio decidendi"
          value={draft.ratio}
          rows={4}
          disabled={busy}
          onChange={(v) => update("ratio", v)}
        />
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Full text</h3>
        <TextArea
          id="j-fullText"
          label="Judgment as delivered"
          value={draft.fullText}
          rows={12}
          disabled={busy}
          onChange={(v) => update("fullText", v)}
        />
      </div>

      <div className="admin-form-actions">
        {mode === "edit" && (
          <button
            type="button"
            className={`btn btn-sm ${published ? "btn-ghost" : "btn-secondary"}`}
            disabled={busy}
            onClick={togglePublish}
          >
            {publishMutation.pending || unpublishMutation.pending
              ? "Working…"
              : published
                ? "Unpublish"
                : "Publish"}
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {saveMutation.pending ? "Saving…" : mode === "create" ? "Create judgment" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
