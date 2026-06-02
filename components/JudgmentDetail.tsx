"use client";

import { ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { tcls } from "@/lib/types";

export function JudgmentDetail() {
  const { selectedCase, setSelectedCase, viewGraph, showToast } = useDashboard();
  if (!selectedCase) return null;

  const item = selectedCase;
  const t = tcls[item.treatment];

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button className="btn btn-link btn-sm" onClick={() => setSelectedCase(null)}>
          <ArrowLeft size={13} /> Back to results
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => viewGraph(item)}>
          <Share2 size={12} /> Citation graph
        </button>
      </div>

      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">{item.court} · {item.year}</div>
          <h2 className="judgment-title">{item.title}</h2>
          <div className="judgment-cite">{item.citation}</div>
        </div>
        <span className={cn("treatment-pill", t)}>{item.treatment}</span>
      </div>

      <div className="judgment-cols">
        <div className="judgment-body">
          <div className="judgment-section">
            <h3>Ratio decidendi</h3>
            <p>{item.ratio}</p>
          </div>
          <div className="judgment-section">
            <h3>Facts</h3>
            <p>{item.facts}</p>
          </div>
          <div className="judgment-section">
            <h3>Held</h3>
            <p>{item.holding}</p>
          </div>
          <div className="judgment-section">
            <h3>Issues for determination</h3>
            <div className="issue-tags">
              {item.issues.map(i => <span className="issue-tag" key={i}>{i}</span>)}
            </div>
          </div>
        </div>
        <aside className="judgment-aside">
          <dl className="meta-dl">
            <div className="aside-section-label">Report metadata</div>
            <dt>Judges</dt><dd>{item.judges}</dd>
            <dt>Area</dt><dd>{item.area}</dd>
            <dt>Posture</dt><dd>{item.posture}</dd>
            <dt>Strength</dt><dd>{item.strength}%</dd>
          </dl>
          <div className="aside-section-label">Authorities considered</div>
          <div className="authority-links">
            {item.authorities.map(a => (
              <button
                key={a}
                className="authority-link-btn"
                onClick={() => showToast(`Opened authority trail: ${a}.`)}
              >
                {a}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
