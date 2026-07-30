"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { legislationApi } from "@/lib/api";
import type { StatuteAmendment, StatuteCase, StatuteDetail, StatuteListItem } from "@/lib/api";
import { useApiQuery, type QueryResult } from "@/lib/api/hooks";
import { AsyncSection, ErrorState, LoadingState } from "./AsyncState";

function CorpusNotFound({ label, backHref, backLabel }: { label: string; backHref: string; backLabel: string }) {
  return (
    <div className="page">
      <Link href={backHref} className="btn btn-link btn-sm">
        <ArrowLeft size={13} /> {backLabel}
      </Link>
      <div className="corpus-not-found" style={{ marginTop: 16 }}>
        <div className="corpus-not-found-code">404</div>
        <p className="corpus-not-found-msg">{label} not found.</p>
      </div>
    </div>
  );
}

function LegacyStatuteRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const statuteId = searchParams.get("statute");
    if (statuteId) {
      router.replace(`/dashboard/legislation/${encodeURIComponent(statuteId)}`);
    }
  }, [searchParams, router]);

  return null;
}

function ForceStatus({ statute }: { statute: Pick<StatuteDetail, "inForce" | "repealed" | "repealedBy"> }) {
  return (
    <div className="corpus-status-row">
      <span className={cn("corpus-status-badge", statute.inForce ? "in-force" : "repealed")}>
        {statute.inForce ? "In force" : "Repealed"}
      </span>
      {!statute.inForce && statute.repealedBy && (
        <span className="corpus-status-note">Repealed by {statute.repealedBy}</span>
      )}
    </div>
  );
}

function AmendmentHistory({ amendments }: { amendments: StatuteAmendment[] }) {
  const sorted = useMemo(
    () =>
      [...amendments].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const aDate = a.effectiveDate ?? "";
        const bDate = b.effectiveDate ?? "";
        return aDate.localeCompare(bDate);
      }),
    [amendments],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="corpus-panel">
      <div className="corpus-panel-title">Amendment history</div>
      <ol className="statute-amendments">
        {sorted.map((amendment) => (
          <li className="statute-amendment-row" key={amendment.id}>
            <div className="statute-amendment-year">{amendment.year}</div>
            <div className="statute-amendment-instrument">{amendment.instrument}</div>
            <p className="statute-amendment-desc">{amendment.description}</p>
            <div className="statute-amendment-meta">
              {amendment.effectiveDate && <>Effective {amendment.effectiveDate} · </>}
              {amendment.sectionNumbers.length > 0 && (
                <span className="statute-amendment-sections">
                  Affected: s. {amendment.sectionNumbers.join(", s. ")}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SectionJudgments({
  sectionNumber,
  casesQuery,
}: {
  sectionNumber: string;
  casesQuery: QueryResult<StatuteCase[]>;
}) {
  const { openCase } = useDashboard();

  if (casesQuery.loading && casesQuery.data === null) {
    return <LoadingState label="Loading judgments…" />;
  }
  if (casesQuery.error) {
    return <ErrorState message={casesQuery.error} onRetry={casesQuery.refetch} />;
  }

  const judgments = (casesQuery.data ?? []).filter((c) => c.section === sectionNumber);

  if (judgments.length === 0) {
    return <p className="citator-empty">No judgments have interpreted this section yet.</p>;
  }

  return (
    <div className="statute-section-judgments">
      {judgments.map((c) => (
        <button className="authority-link-btn" key={c.id} onClick={() => openCase(c.id)}>
          {c.title}
        </button>
      ))}
    </div>
  );
}

function StatuteSection({
  statuteId,
  section,
  casesQuery,
  highlighted,
}: {
  statuteId: string;
  section: StatuteDetail["sections"][number];
  casesQuery: QueryResult<StatuteCase[]>;
  highlighted: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlighted]);

  const sectionHref = `/dashboard/legislation/${encodeURIComponent(statuteId)}/sections/${encodeURIComponent(section.number)}`;

  return (
    <div
      ref={sectionRef}
      id={`section-${section.number}`}
      className={cn(
        "statute-section",
        section.repealed && "statute-section-repealed",
        highlighted && "statute-section-highlight",
      )}
    >
      <div className="statute-section-head">
        <span className="statute-section-number">s. {section.number}</span>
        <h3>{section.heading}</h3>
        {section.repealed && <span className="statute-section-flag">Repealed</span>}
        <Link href={sectionHref} className="statute-section-link" title="Copy link to this section">
          <Link2 size={13} />
        </Link>
      </div>
      {section.amendmentNote && <div className="statute-section-note">{section.amendmentNote}</div>}
      <p className="statute-section-text">{section.text}</p>
      <div className="aside-section-label" style={{ marginTop: 12 }}>
        Judgments interpreting this section
      </div>
      <SectionJudgments sectionNumber={section.number} casesQuery={casesQuery} />
    </div>
  );
}

/**
 * A section may be addressed by its number, as a citation does, or by its id, as
 * search results do. Both resolve to the same section.
 */
function matchesSection(section: StatuteDetail["sections"][number], ref?: string): boolean {
  if (!ref) return false;
  return section.number === ref || section.id === ref;
}

function StatuteDetailContent({
  statute,
  sectionNumber,
}: {
  statute: StatuteDetail;
  sectionNumber?: string;
}) {
  const casesQuery = useApiQuery(`legislation:${statute.id}:cases`, () =>
    legislationApi.cases(statute.id),
  );

  return (
    <>
      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">
            {statute.jurisdiction} · {statute.year}
          </div>
          <h2 className="judgment-title">{statute.title}</h2>
          {statute.longTitle && <p className="corpus-long-title">{statute.longTitle}</p>}
          <ForceStatus statute={statute} />
        </div>
      </div>

      <div className="corpus-meta-grid">
        {statute.chapter && (
          <div className="corpus-meta-item">
            <div className="corpus-meta-label">Chapter</div>
            <div className="corpus-meta-value">{statute.chapter}</div>
          </div>
        )}
        {statute.commencement && (
          <div className="corpus-meta-item">
            <div className="corpus-meta-label">Commencement</div>
            <div className="corpus-meta-value">{statute.commencement}</div>
          </div>
        )}
        <div className="corpus-meta-item">
          <div className="corpus-meta-label">Sections</div>
          <div className="corpus-meta-value">{statute.sections.length}</div>
        </div>
      </div>

      <AmendmentHistory amendments={statute.amendments} />

      <div className="statute-sections">
        {statute.sections.map((sec) => (
          <StatuteSection
            key={sec.number}
            statuteId={statute.id}
            section={sec}
            casesQuery={casesQuery}
            highlighted={matchesSection(sec, sectionNumber)}
          />
        ))}
      </div>
    </>
  );
}

function StatuteDetailBody({
  statuteId,
  sectionNumber,
  onBack,
}: {
  statuteId: string;
  sectionNumber?: string;
  onBack: () => void;
}) {
  const query = useApiQuery(`legislation:${statuteId}`, () => legislationApi.detail(statuteId));

  if (query.error?.toLowerCase().includes("not found")) {
    return (
      <CorpusNotFound
        label="Statute"
        backHref="/dashboard/legislation"
        backLabel="Back to legislation"
      />
    );
  }

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={onBack}>
        <ArrowLeft size={13} /> Back to legislation
      </button>
      <AsyncSection query={query} loadingLabel="Loading statute…">
        {(statute) => (
          <>
            {sectionNumber &&
              !statute.sections.some((s) => matchesSection(s, sectionNumber)) && (
                <div className="corpus-not-found" style={{ marginTop: 16, marginBottom: 16 }}>
                  <p className="corpus-not-found-msg">
                    Section {sectionNumber} is not part of this statute.
                  </p>
                </div>
              )}
            <StatuteDetailContent statute={statute} sectionNumber={sectionNumber} />
          </>
        )}
      </AsyncSection>
    </div>
  );
}

export function LegislationDetail({
  statuteId,
  sectionNumber,
}: {
  statuteId: string;
  sectionNumber?: string;
}) {
  const router = useRouter();

  return (
    <StatuteDetailBody
      statuteId={statuteId}
      sectionNumber={sectionNumber}
      onBack={() => router.push("/dashboard/legislation")}
    />
  );
}

function StatuteList({
  query,
  jurisdiction,
  onJurisdictionChange,
  jurisdictions,
}: {
  query: ReturnType<typeof useApiQuery<StatuteListItem[]>>;
  jurisdiction: string;
  onJurisdictionChange: (j: string) => void;
  jurisdictions: string[];
}) {
  const router = useRouter();

  return (
    <>
      <div className="filters">
        <button
          className={cn("filter-pill", jurisdiction === "" && "active")}
          onClick={() => onJurisdictionChange("")}
        >
          All jurisdictions
        </button>
        {jurisdictions.map((j) => (
          <button
            key={j}
            className={cn("filter-pill", jurisdiction === j && "active")}
            onClick={() => onJurisdictionChange(j)}
          >
            {j}
          </button>
        ))}
      </div>

      <AsyncSection query={query} loadingLabel="Loading legislation…" emptyMessage="No statutes available.">
        {(statutes) => (
          <div className="statute-list">
            {statutes.map((s) => (
              <button
                className="statute-list-row"
                key={s.id}
                onClick={() => router.push(`/dashboard/legislation/${encodeURIComponent(s.id)}`)}
              >
                <div className="statute-list-row-inner">
                  <div className="statute-list-title">{s.title}</div>
                  <div className="statute-list-meta">
                    {s.year} · {s.sectionCount} section{s.sectionCount === 1 ? "" : "s"} ·{" "}
                    <span className="statute-list-jurisdiction">{s.jurisdiction}</span>
                  </div>
                </div>
                <div className="statute-list-badges">
                  <span
                    className={cn("statute-list-badge", s.inForce ? "in-force" : "repealed")}
                  >
                    {s.inForce ? "In force" : "Repealed"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </AsyncSection>
    </>
  );
}

export function Legislation() {
  const [jurisdiction, setJurisdiction] = useState("");

  const allQuery = useApiQuery("legislation:list:all", () => legislationApi.list());
  const filteredQuery = useApiQuery(
    jurisdiction ? `legislation:list:${jurisdiction}` : null,
    () => legislationApi.list(jurisdiction),
  );

  const listQuery = jurisdiction ? filteredQuery : allQuery;

  const jurisdictions = useMemo(() => {
    const items = allQuery.data ?? [];
    return Array.from(new Set(items.map((s) => s.jurisdiction))).sort();
  }, [allQuery.data]);

  return (
    <div className="page">
      <Suspense fallback={null}>
        <LegacyStatuteRedirect />
      </Suspense>
      <div className="page-header">
        <div>
          <p className="label">Legislation library</p>
          <h2>Statutes & Laws of the Federation</h2>
        </div>
      </div>
      <StatuteList
        query={listQuery}
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        jurisdictions={jurisdictions}
      />
    </div>
  );
}
