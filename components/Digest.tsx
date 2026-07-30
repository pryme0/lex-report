"use client";

import { useEffect, useState } from "react";
import { BookOpen, ListOrdered, Scale, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { tcls, type CaseItem } from "@/lib/types";
import {
  fetchDigestTree,
  fetchTableOfCases,
  fetchTableOfStatutes,
  placeholderCase,
  type DigestCategoryNode,
  type TableOfStatutesEntry,
} from "@/lib/api";

type DigestTab = "digest" | "table-of-cases" | "table-of-statutes";

// ─── Digest (subject-classified browse) ──────────────────────────────────────

function DigestView({ nodes, onOpen }: { nodes: DigestCategoryNode[]; onOpen: (c: CaseItem) => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(nodes[0]?.id ?? null);

  return (
    <div className="digest-groups">
      {nodes.map((top) => (
        <div className="digest-group" key={top.id}>
          <button className="digest-group-head" onClick={() => setOpenGroup(openGroup === top.id ? null : top.id)}>
            <span>{top.name}</span>
            <span className="digest-group-count">
              {top.children.reduce((n, c) => n + c.cases.length, 0) + top.cases.length} case
              {top.children.reduce((n, c) => n + c.cases.length, 0) + top.cases.length === 1 ? "" : "s"}
            </span>
          </button>
          {openGroup === top.id && (
            <div className="digest-group-body">
              {[...top.cases, ...top.children.flatMap((c) => c.cases)].map((c) => (
                <button className="digest-case-row" key={c.id} onClick={() => onOpen(c)}>
                  <div>
                    <div className="digest-case-title">{c.title}</div>
                    <div className="digest-case-sub">{c.court} · {c.citation}</div>
                  </div>
                  <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Table of Cases (alphabetical index) ─────────────────────────────────────

function TableOfCases({ cases, onOpen }: { cases: CaseItem[]; onOpen: (c: CaseItem) => void }) {
  const letters = Array.from(new Set(cases.map((c) => c.title[0].toUpperCase()))).sort();

  return (
    <div className="toc-layout">
      <div className="toc-jump">
        {letters.map((l) => (
          <a key={l} href={`#toc-${l}`} className="toc-jump-letter">{l}</a>
        ))}
      </div>
      <div className="toc-list">
        {cases.map((c, i) => {
          const letter = c.title[0].toUpperCase();
          const isFirstOfLetter = i === 0 || cases[i - 1].title[0].toUpperCase() !== letter;
          return (
            <div key={c.id}>
              {isFirstOfLetter && <div className="toc-letter-heading" id={`toc-${letter}`}>{letter}</div>}
              <button className="toc-row" onClick={() => onOpen(c)}>
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

function TableOfStatutes({ entries, onOpen }: { entries: TableOfStatutesEntry[]; onOpen: (c: CaseItem) => void }) {
  return (
    <div className="tos-list">
      {entries.map((s) => (
        <div className="tos-entry" key={s.title}>
          <div className="tos-entry-title">{s.title}</div>
          <div className="tos-entry-cases">
            {s.cases.map(({ caseCode, caseTitle, section }) => (
              <button
                className="tos-case-row"
                key={caseCode + (section ?? "")}
                onClick={() => onOpen(placeholderCase(caseCode, caseTitle))}
              >
                <span>{caseTitle}</span>
                {section && <span className="tos-case-section">{section}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Digest (main export) ────────────────────────────────────────────────────

export function Digest() {
  const { setSelectedCase, viewGraph, showToast } = useDashboard();
  const [tab, setTab] = useState<DigestTab>("digest");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<DigestCategoryNode[]>([]);
  const [tableOfCases, setTableOfCases] = useState<CaseItem[]>([]);
  const [tableOfStatutes, setTableOfStatutes] = useState<TableOfStatutesEntry[]>([]);

  useEffect(() => {
    Promise.all([fetchDigestTree(), fetchTableOfCases(), fetchTableOfStatutes()])
      .then(([treeRes, casesRes, statutesRes]) => {
        setTree(treeRes);
        setTableOfCases(casesRes);
        setTableOfStatutes(statutesRes);
      })
      .catch(() => showToast("Could not load the digest."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { id: DigestTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "digest",             label: "Digest",            icon: BookOpen },
    { id: "table-of-cases",     label: "Table of Cases",    icon: ListOrdered },
    { id: "table-of-statutes",  label: "Table of Statutes", icon: Scale },
  ];

  function open(c: CaseItem) {
    setSelectedCase(c);
  }

  return (
    <div className="lib-shell">
      <div className="lib-tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={cn("studio-tab", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} />
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
            {tableOfCases[0] && (
              <button className="btn btn-ghost btn-sm" onClick={() => viewGraph(tableOfCases[0])}>
                <Share2 size={12} /> Citation graph
              </button>
            )}
          </div>

          {loading ? (
            <p className="citator-empty">Loading digest…</p>
          ) : (
            <>
              {tab === "digest" && <DigestView nodes={tree} onOpen={open} />}
              {tab === "table-of-cases" && <TableOfCases cases={tableOfCases} onOpen={open} />}
              {tab === "table-of-statutes" && <TableOfStatutes entries={tableOfStatutes} onOpen={open} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
