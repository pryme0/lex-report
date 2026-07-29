"use client";

import { useMemo, useState } from "react";
import { BookOpen, ListOrdered, Scale, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { cases } from "@/lib/data";
import type { CaseItem } from "@/lib/types";
import { tcls } from "@/lib/types";

type DigestTab = "digest" | "table-of-cases" | "table-of-statutes";

// ─── Digest (subject-classified browse) ──────────────────────────────────────

function DigestView({ onOpen }: { onOpen: (c: CaseItem) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, CaseItem[]>();
    for (const c of cases) {
      const topLevel = c.digestArea.split("→")[0].trim();
      if (!map.has(topLevel)) map.set(topLevel, []);
      map.get(topLevel)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.[0] ?? null);

  return (
    <div className="digest-groups">
      {groups.map(([area, items]) => (
        <div className="digest-group" key={area}>
          <button className="digest-group-head" onClick={() => setOpenGroup(openGroup === area ? null : area)}>
            <span>{area}</span>
            <span className="digest-group-count">{items.length} case{items.length === 1 ? "" : "s"}</span>
          </button>
          {openGroup === area && (
            <div className="digest-group-body">
              {items.map(c => (
                <button className="digest-case-row" key={c.id} onClick={() => onOpen(c)}>
                  <div>
                    <div className="digest-case-title">{c.title}</div>
                    <div className="digest-case-sub">{c.digestArea.split("→").slice(1).join("→").trim() || c.court} · {c.citation}</div>
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

function TableOfCases({ onOpen }: { onOpen: (c: CaseItem) => void }) {
  const sorted = useMemo(() => [...cases].sort((a, b) => a.title.localeCompare(b.title)), []);
  const letters = useMemo(() => {
    const set = new Set(sorted.map(c => c.title[0].toUpperCase()));
    return Array.from(set).sort();
  }, [sorted]);

  return (
    <div className="toc-layout">
      <div className="toc-jump">
        {letters.map(l => (
          <a key={l} href={`#toc-${l}`} className="toc-jump-letter">{l}</a>
        ))}
      </div>
      <div className="toc-list">
        {sorted.map((c, i) => {
          const letter = c.title[0].toUpperCase();
          const isFirstOfLetter = i === 0 || sorted[i - 1].title[0].toUpperCase() !== letter;
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

function TableOfStatutes({ onOpen }: { onOpen: (c: CaseItem) => void }) {
  const statutes = useMemo(() => {
    const map = new Map<string, { title: string; cases: { case: CaseItem; section?: string }[] }>();
    for (const c of cases) {
      for (const s of c.citedStatutes) {
        if (!map.has(s.title)) map.set(s.title, { title: s.title, cases: [] });
        map.get(s.title)!.cases.push({ case: c, section: s.section });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  return (
    <div className="tos-list">
      {statutes.map(s => (
        <div className="tos-entry" key={s.title}>
          <div className="tos-entry-title">{s.title}</div>
          <div className="tos-entry-cases">
            {s.cases.map(({ case: c, section }) => (
              <button className="tos-case-row" key={c.id + (section ?? "")} onClick={() => onOpen(c)}>
                <span>{c.title}</span>
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
  const { setSelectedCase, viewGraph } = useDashboard();
  const [tab, setTab] = useState<DigestTab>("digest");

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
            <button className="btn btn-ghost btn-sm" onClick={() => viewGraph(cases[0])}>
              <Share2 size={12} /> Citation graph
            </button>
          </div>

          {tab === "digest" && <DigestView onOpen={open} />}
          {tab === "table-of-cases" && <TableOfCases onOpen={open} />}
          {tab === "table-of-statutes" && <TableOfStatutes onOpen={open} />}
        </div>
      </div>
    </div>
  );
}
