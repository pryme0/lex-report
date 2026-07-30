"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { fetchStatute, fetchStatutes, placeholderCase, type StatuteSummary } from "@/lib/api";
import type { Statute } from "@/lib/types";

function StatuteList({ statutes, onOpen }: { statutes: StatuteSummary[]; onOpen: (id: string) => void }) {
  return (
    <div className="statute-list">
      {statutes.map(s => (
        <button className="statute-list-row" key={s.id} onClick={() => onOpen(s.id)}>
          <div>
            <div className="statute-list-title">{s.title}</div>
            <div className="statute-list-meta">{s.year} · {s.sectionCount} section{s.sectionCount === 1 ? "" : "s"}</div>
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
          const judgments = sec.interpretingCases ?? [];
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
                    <button
                      className="authority-link-btn"
                      key={c.caseCode}
                      onClick={() => setSelectedCase(placeholderCase(c.caseCode, c.caseTitle))}
                    >
                      {c.caseTitle}
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
  const { showToast } = useDashboard();
  const [statutes, setStatutes] = useState<StatuteSummary[]>([]);
  const [active, setActive] = useState<Statute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatutes()
      .then(setStatutes)
      .catch(() => showToast("Could not load the legislation library."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function open(id: string) {
    fetchStatute(id)
      .then(setActive)
      .catch(() => showToast("Could not load that statute."));
  }

  if (active) return <StatuteDetail statute={active} onBack={() => setActive(null)} />;

  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Legislation library</p><h2>Statutes & Laws of the Federation</h2></div>
      </div>
      {loading ? <p className="citator-empty">Loading legislation…</p> : <StatuteList statutes={statutes} onOpen={open} />}
    </div>
  );
}
