"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ListOrdered, Scale, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi, digestApi } from "@/lib/api";
import type {
  CaseIndexItem,
  DigestStatuteEntry,
  DigestSubjectArea,
} from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { tcls } from "@/lib/types";
import { AsyncSection } from "./AsyncState";

type DigestTab = "digest" | "table-of-cases" | "table-of-statutes";

// ─── Digest (subject-classified browse) ──────────────────────────────────────

function DigestView({
  query,
  onOpen,
}: {
  query: ReturnType<typeof useApiQuery<DigestSubjectArea[]>>;
  onOpen: (id: string) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <AsyncSection query={query} loadingLabel="Loading digest…" emptyMessage="No digest entries yet.">
      {(areas) => (
        <DigestGroups areas={areas} openGroup={openGroup} setOpenGroup={setOpenGroup} onOpen={onOpen} />
      )}
    </AsyncSection>
  );
}

function DigestGroups({
  areas,
  openGroup,
  setOpenGroup,
  onOpen,
}: {
  areas: DigestSubjectArea[];
  openGroup: string | null;
  setOpenGroup: (area: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (areas.length > 0 && !initializedRef.current) {
      setOpenGroup(areas[0].area);
      initializedRef.current = true;
    }
  }, [areas, setOpenGroup]);

  return (
    <div className="digest-groups">
      {areas.map(({ area, subAreas }) => {
        const items = subAreas.flatMap((s) => s.cases);
        return (
          <div className="digest-group" key={area}>
            <button
              className="digest-group-head"
              type="button"
              aria-expanded={openGroup === area}
              onClick={() => setOpenGroup(openGroup === area ? null : area)}
            >
              <span>{area}</span>
              <span className="digest-group-count">
                {items.length} case{items.length === 1 ? "" : "s"}
              </span>
            </button>
            {openGroup === area && (
              <div className="digest-group-body">
                {items.map((c) => (
                  <button className="digest-case-row" key={c.id} onClick={() => onOpen(c.id)}>
                    <div>
                      <div className="digest-case-title">{c.title}</div>
                      <div className="digest-case-sub">
                        {c.digestArea.split("→").slice(1).join("→").trim() || c.court} · {c.citation}
                      </div>
                    </div>
                    <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Table of Cases (alphabetical index) ─────────────────────────────────────

function TableOfCases({
  query,
  onOpen,
}: {
  query: ReturnType<typeof useApiQuery<CaseIndexItem[]>>;
  onOpen: (id: string) => void;
}) {
  return (
    <AsyncSection query={query} loadingLabel="Loading cases…" emptyMessage="No cases indexed yet.">
      {(sorted) => <TableOfCasesList sorted={sorted} onOpen={onOpen} />}
    </AsyncSection>
  );
}

function TableOfCasesList({
  sorted,
  onOpen,
}: {
  sorted: CaseIndexItem[];
  onOpen: (id: string) => void;
}) {
  const letters = useMemo(() => {
    const set = new Set(sorted.map((c) => c.title[0].toUpperCase()));
    return Array.from(set).sort();
  }, [sorted]);

  return (
    <div className="toc-layout">
      <div className="toc-jump">
        {letters.map((l) => (
          <a key={l} href={`#toc-${l}`} className="toc-jump-letter">
            {l}
          </a>
        ))}
      </div>
      <div className="toc-list">
        {sorted.map((c, i) => {
          const letter = c.title[0].toUpperCase();
          const isFirstOfLetter = i === 0 || sorted[i - 1].title[0].toUpperCase() !== letter;
          return (
            <div key={c.id}>
              {isFirstOfLetter && (
                <div className="toc-letter-heading" id={`toc-${letter}`}>
                  {letter}
                </div>
              )}
              <button className="toc-row" onClick={() => onOpen(c.id)}>
                <span className="toc-row-title">{c.title}</span>
                <span className="toc-row-cite">{c.citation}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table of Statutes ────────────────────────────────────────────────────────

function TableOfStatutes({
  query,
  onOpen,
}: {
  query: ReturnType<typeof useApiQuery<DigestStatuteEntry[]>>;
  onOpen: (id: string) => void;
}) {
  return (
    <AsyncSection query={query} loadingLabel="Loading statutes…" emptyMessage="No statutes indexed yet.">
      {(statutes) => (
        <div className="tos-list">
          {statutes.map((s, i) => (
            <div className="tos-entry" key={`${s.title}-${i}`}>
              <div className="tos-entry-title">{s.title}</div>
              <div className="tos-entry-cases">
                {s.cases.map(({ caseId, title, section }) => (
                  <button
                    className="tos-case-row"
                    key={caseId + (section ?? "")}
                    onClick={() => onOpen(caseId)}
                  >
                    <span>{title}</span>
                    {section && <span className="tos-case-section">{section}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AsyncSection>
  );
}

// ─── Digest (main export) ────────────────────────────────────────────────────

export function Digest() {
  const { openCase, viewGraph } = useDashboard();
  const [tab, setTab] = useState<DigestTab>("digest");
  const [lastOpenedCaseId, setLastOpenedCaseId] = useState<string | null>(null);

  const subjectsQuery = useApiQuery(
    tab === "digest" ? "digest:subjects" : null,
    () => digestApi.subjects(),
  );
  const indexQuery = useApiQuery(tab === "table-of-cases" ? "cases:index" : null, () =>
    casesApi.index(),
  );
  const statutesQuery = useApiQuery(
    tab === "table-of-statutes" ? "digest:statutes" : null,
    () => digestApi.statutes(),
  );

  const handleOpenCase = (id: string) => {
    setLastOpenedCaseId(id);
    openCase(id);
  };

  const tabs: { id: DigestTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "digest", label: "Digest", icon: BookOpen },
    { id: "table-of-cases", label: "Table of Cases", icon: ListOrdered },
    { id: "table-of-statutes", label: "Table of Statutes", icon: Scale },
  ];

  return (
    <div className="lib-shell">
      <div className="lib-tab-bar" role="tablist" aria-label="Digest views">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={cn("studio-tab", tab === t.id && "active")}
            aria-selected={tab === t.id}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="lib-content">
        <div className="page">
          <div className="page-header">
            <div>
              <p className="label">Digest</p>
              <h2>
                {tab === "digest" && "Browse by subject"}
                {tab === "table-of-cases" && "Alphabetical index"}
                {tab === "table-of-statutes" && "Statutes considered"}
              </h2>
            </div>
            {lastOpenedCaseId && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => viewGraph(lastOpenedCaseId)}
              >
                <Share2 size={12} aria-hidden="true" /> Citation graph
              </button>
            )}
          </div>

          <div role="tabpanel" aria-live="polite">
            {tab === "digest" && <DigestView query={subjectsQuery} onOpen={handleOpenCase} />}
            {tab === "table-of-cases" && <TableOfCases query={indexQuery} onOpen={handleOpenCase} />}
            {tab === "table-of-statutes" && (
              <TableOfStatutes query={statutesQuery} onOpen={handleOpenCase} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
