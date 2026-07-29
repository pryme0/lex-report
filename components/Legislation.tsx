"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cases } from "@/lib/data";
import { statutes } from "@/lib/legislation-data";
import type { CaseItem, Statute } from "@/lib/types";

// Sections are cited as either a single number ("s 4") or a range ("ss 222–224").
// Extract all digits and treat two-or-more as a low–high range.
function sectionMatches(sectionNumber: string, citedSection?: string): boolean {
  if (!citedSection) return false;
  const nums = citedSection.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return false;
  const target = Number(sectionNumber);
  const low = Math.min(...nums);
  const high = Math.max(...nums);
  return target >= low && target <= high;
}

function interpretingCases(statute: Statute, sectionNumber?: string): CaseItem[] {
  return cases.filter(c =>
    c.citedStatutes.some(s => s.title === statute.shortTitle && (!sectionNumber || sectionMatches(sectionNumber, s.section)))
  );
}

function StatuteList({ onOpen }: { onOpen: (s: Statute) => void }) {
  return (
    <div className="statute-list">
      {statutes.map(s => (
        <button className="statute-list-row" key={s.id} onClick={() => onOpen(s)}>
          <div>
            <div className="statute-list-title">{s.title}</div>
            <div className="statute-list-meta">{s.year} · {s.sections.length} section{s.sections.length === 1 ? "" : "s"}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StatuteDetail({ statute, onBack }: { statute: Statute; onBack: () => void }) {
  const { setSelectedCase } = useDashboard();

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={onBack}>
        <ArrowLeft size={13} /> Back to legislation
      </button>

      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">{statute.year}</div>
          <h2 className="judgment-title">{statute.title}</h2>
        </div>
      </div>

      <div className="statute-sections">
        {statute.sections.map(sec => {
          const judgments = interpretingCases(statute, sec.number);
          return (
            <div className="statute-section" key={sec.number}>
              <div className="statute-section-head">
                <span className="statute-section-number">s. {sec.number}</span>
                <h3>{sec.heading}</h3>
              </div>
              <p className="statute-section-text">{sec.text}</p>
              <div className="aside-section-label" style={{ marginTop: 12 }}>Judgments interpreting this section</div>
              {judgments.length === 0 ? (
                <p className="citator-empty">No judgments have interpreted this section yet.</p>
              ) : (
                <div className="statute-section-judgments">
                  {judgments.map(c => (
                    <button className="authority-link-btn" key={c.id} onClick={() => setSelectedCase(c)}>
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Legislation() {
  const [active, setActive] = useState<Statute | null>(null);

  if (active) return <StatuteDetail statute={active} onBack={() => setActive(null)} />;

  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Legislation library</p><h2>Statutes & Laws of the Federation</h2></div>
      </div>
      <StatuteList onOpen={setActive} />
    </div>
  );
}
