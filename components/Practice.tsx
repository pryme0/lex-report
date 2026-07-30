"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { practiceApi } from "@/lib/api";
import type {
  CourtForm,
  CourtFormDetail,
  PracticeInstrument,
  PracticeInstrumentDetail,
  PracticeInstrumentKind,
} from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection } from "./AsyncState";

function CorpusNotFound({ label, backHref, backLabel }: { label: string; backHref: string; backLabel: string }) {
  return (
    <div className="page">
      <Link href={backHref} className="btn btn-link btn-sm">
        <ArrowLeft size={13} /> {backLabel}
      </Link>
      <div className="corpus-not-found">
        <h2>{label} not available</h2>
        <p className="corpus-not-found-msg">
          This {label.toLowerCase()} is not in the corpus. It may have been withdrawn, or the link
          may be out of date.
        </p>
        <Link href={backHref} className="btn btn-secondary btn-sm">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

function kindLabel(kind: PracticeInstrumentKind) {
  return kind === "rules" ? "Rules of court" : "Practice direction";
}

function KindBadge({ kind }: { kind: PracticeInstrumentKind }) {
  return (
    <span className={cn("practice-kind-badge", kind === "rules" ? "rules" : "practice-direction")}>
      {kindLabel(kind)}
    </span>
  );
}

function InstrumentList({
  instruments,
  onOpen,
}: {
  instruments: PracticeInstrument[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="practice-list">
      {instruments.map((item) => (
        <button className="practice-list-row" key={item.id} onClick={() => onOpen(item.id)}>
          <div>
            <div className="practice-list-title">{item.title}</div>
            <div className="practice-list-meta">
              {item.court} · {item.year} · {item.provisionCount} provision
              {item.provisionCount === 1 ? "" : "s"}
            </div>
            {item.description && <p className="practice-list-desc">{item.description}</p>}
          </div>
          <KindBadge kind={item.kind} />
        </button>
      ))}
    </div>
  );
}

function FormList({ forms, onOpen }: { forms: CourtForm[]; onOpen: (id: string) => void }) {
  return (
    <div className="practice-list">
      {forms.map((form) => (
        <button className="practice-list-row" key={form.id} onClick={() => onOpen(form.id)}>
          <div>
            <div className="practice-list-title">{form.title}</div>
            <div className="practice-list-meta">
              {form.code} · {form.court} · {form.jurisdiction}
            </div>
            {form.description && <p className="practice-list-desc">{form.description}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

function InstrumentFilters({
  courts,
  court,
  onCourtChange,
  kind,
  onKindChange,
}: {
  courts: string[];
  court: string;
  onCourtChange: (c: string) => void;
  kind: PracticeInstrumentKind | "";
  onKindChange: (k: PracticeInstrumentKind | "") => void;
}) {
  return (
    <div className="facet-groups">
      <div className="facet-group" role="group" aria-label="Filter by court">
        <span className="facet-group-label">Court</span>
        <div className="filters">
          <button
            className={cn("filter-pill", court === "" && "active")}
            onClick={() => onCourtChange("")}
          >
            All courts
          </button>
          {courts.map((c) => (
            <button
              key={c}
              className={cn("filter-pill", court === c && "active")}
              onClick={() => onCourtChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="facet-group" role="group" aria-label="Filter by instrument kind">
        <span className="facet-group-label">Kind</span>
        <div className="filters">
          <button
            className={cn("filter-pill", kind === "" && "active")}
            onClick={() => onKindChange("")}
          >
            All kinds
          </button>
          <button
            className={cn("filter-pill", kind === "rules" && "active")}
            onClick={() => onKindChange("rules")}
          >
            Rules of court
          </button>
          <button
            className={cn("filter-pill", kind === "practice-direction" && "active")}
            onClick={() => onKindChange("practice-direction")}
          >
            Practice directions
          </button>
        </div>
      </div>
    </div>
  );
}

function FormFilters({
  courts,
  court,
  onCourtChange,
}: {
  courts: string[];
  court: string;
  onCourtChange: (c: string) => void;
}) {
  return (
    <div className="filters">
      <button
        className={cn("filter-pill", court === "" && "active")}
        onClick={() => onCourtChange("")}
      >
        All courts
      </button>
      {courts.map((c) => (
        <button
          key={c}
          className={cn("filter-pill", court === c && "active")}
          onClick={() => onCourtChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function Practice() {
  const router = useRouter();
  const [tab, setTab] = useState<"instruments" | "forms">("instruments");
  const [instrumentCourt, setInstrumentCourt] = useState("");
  const [instrumentKind, setInstrumentKind] = useState<PracticeInstrumentKind | "">("");
  const [formCourt, setFormCourt] = useState("");

  const allInstrumentsQuery = useApiQuery("practice:instruments:all", () =>
    practiceApi.instruments(),
  );
  const instrumentsQuery = useApiQuery(
    `practice:instruments:${instrumentCourt}:${instrumentKind}`,
    () =>
      practiceApi.instruments({
        court: instrumentCourt || undefined,
        kind: instrumentKind || undefined,
      }),
  );

  const allFormsQuery = useApiQuery("practice:forms:all", () => practiceApi.forms());
  const formsQuery = useApiQuery(`practice:forms:${formCourt}`, () =>
    practiceApi.forms({ court: formCourt || undefined }),
  );

  const instrumentCourts = useMemo(() => {
    const items = allInstrumentsQuery.data ?? [];
    return Array.from(new Set(items.map((i) => i.court))).sort();
  }, [allInstrumentsQuery.data]);

  const formCourts = useMemo(() => {
    const items = allFormsQuery.data ?? [];
    return Array.from(new Set(items.map((f) => f.court))).sort();
  }, [allFormsQuery.data]);

  const resolvedInstrumentsQuery =
    instrumentCourt || instrumentKind ? instrumentsQuery : allInstrumentsQuery;
  const resolvedFormsQuery = formCourt ? formsQuery : allFormsQuery;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="label">Procedural corpus</p>
          <h2>Practice & Forms</h2>
        </div>
      </div>

      <div className="practice-tabs">
        <button
          className={cn("practice-tab", tab === "instruments" && "active")}
          onClick={() => setTab("instruments")}
        >
          Rules & directions
        </button>
        <button
          className={cn("practice-tab", tab === "forms" && "active")}
          onClick={() => setTab("forms")}
        >
          Court forms
        </button>
      </div>

      {tab === "instruments" ? (
        <>
          <InstrumentFilters
            courts={instrumentCourts}
            court={instrumentCourt}
            onCourtChange={setInstrumentCourt}
            kind={instrumentKind}
            onKindChange={setInstrumentKind}
          />
          <AsyncSection
            query={resolvedInstrumentsQuery}
            loadingLabel="Loading instruments…"
            emptyMessage="No instruments match these filters."
            isEmpty={(items) => items.length === 0}
          >
            {(instruments) => (
              <InstrumentList
                instruments={instruments}
                onOpen={(id) =>
                  router.push(`/dashboard/practice/instruments/${encodeURIComponent(id)}`)
                }
              />
            )}
          </AsyncSection>
        </>
      ) : (
        <>
          <FormFilters courts={formCourts} court={formCourt} onCourtChange={setFormCourt} />
          <AsyncSection
            query={resolvedFormsQuery}
            loadingLabel="Loading forms…"
            emptyMessage="No forms match these filters."
            isEmpty={(items) => items.length === 0}
          >
            {(forms) => (
              <FormList
                forms={forms}
                onOpen={(id) => router.push(`/dashboard/practice/forms/${encodeURIComponent(id)}`)}
              />
            )}
          </AsyncSection>
        </>
      )}
    </div>
  );
}

function InstrumentDetailContent({
  instrument,
  forms,
}: {
  instrument: PracticeInstrumentDetail;
  forms: CourtForm[];
}) {
  const router = useRouter();
  const attachedForms = forms.filter((f) => f.instrumentId === instrument.id);

  return (
    <>
      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">
            {instrument.court} · {instrument.year}
          </div>
          <h2 className="judgment-title">{instrument.title}</h2>
          <div className="corpus-status-row">
            <KindBadge kind={instrument.kind} />
            <span className="corpus-status-note">{instrument.jurisdiction}</span>
          </div>
          {instrument.description && (
            <p className="corpus-long-title">{instrument.description}</p>
          )}
        </div>
      </div>

      {attachedForms.length > 0 && (
        <div className="corpus-panel">
          <div className="corpus-panel-title">Court forms under this instrument</div>
          <div className="practice-forms-grid">
            {attachedForms.map((form) => (
              <button
                className="practice-form-row"
                key={form.id}
                onClick={() =>
                  router.push(`/dashboard/practice/forms/${encodeURIComponent(form.id)}`)
                }
              >
                <span className="practice-form-code">{form.code}</span>
                <div>
                  <div className="practice-form-title">{form.title}</div>
                  {form.description && <div className="practice-form-desc">{form.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="practice-provisions">
        {instrument.provisions.map((provision) => (
          <div className="practice-provision" key={provision.id}>
            <div className="practice-provision-head">
              <span className="practice-provision-number">{provision.number}</span>
              <h3>{provision.heading}</h3>
            </div>
            <p className="practice-provision-text">{provision.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function PracticeInstrumentDetail({ instrumentId }: { instrumentId: string }) {
  const router = useRouter();
  const instrumentQuery = useApiQuery(`practice:instrument:${instrumentId}`, () =>
    practiceApi.instrument(instrumentId),
  );
  const formsQuery = useApiQuery("practice:forms:all", () => practiceApi.forms());

  if (instrumentQuery.error?.toLowerCase().includes("not found")) {
    return (
      <CorpusNotFound
        label="Instrument"
        backHref="/dashboard/practice"
        backLabel="Back to practice & forms"
      />
    );
  }

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={() => router.push("/dashboard/practice")}>
        <ArrowLeft size={13} /> Back to practice & forms
      </button>
      <AsyncSection query={instrumentQuery} loadingLabel="Loading instrument…">
        {(instrument) => (
          <InstrumentDetailContent instrument={instrument} forms={formsQuery.data ?? []} />
        )}
      </AsyncSection>
    </div>
  );
}

function FormDetailContent({ form }: { form: CourtFormDetail }) {
  const router = useRouter();

  return (
    <>
      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">
            {form.code} · {form.court}
          </div>
          <h2 className="judgment-title">{form.title}</h2>
          {form.description && <p className="corpus-long-title">{form.description}</p>}
        </div>
      </div>

      {form.instrumentId && (
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              router.push(
                `/dashboard/practice/instruments/${encodeURIComponent(form.instrumentId!)}`,
              )
            }
          >
            View parent instrument
          </button>
        </div>
      )}

      <div className="form-content-wrap">
        <div className="corpus-panel-title">Form text</div>
        <pre className="form-content-pre">{form.content}</pre>
      </div>
    </>
  );
}

export function PracticeFormDetail({ formId }: { formId: string }) {
  const router = useRouter();
  const query = useApiQuery(`practice:form:${formId}`, () => practiceApi.form(formId));

  if (query.error?.toLowerCase().includes("not found")) {
    return (
      <CorpusNotFound
        label="Form"
        backHref="/dashboard/practice"
        backLabel="Back to practice & forms"
      />
    );
  }

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={() => router.push("/dashboard/practice")}>
        <ArrowLeft size={13} /> Back to practice & forms
      </button>
      <AsyncSection query={query} loadingLabel="Loading form…">
        {(form) => <FormDetailContent form={form} />}
      </AsyncSection>
    </div>
  );
}
