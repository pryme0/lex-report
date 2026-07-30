"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { tcls, type CaseItem } from "@/lib/types";
import { fetchCaseDetail } from "@/lib/api";
import { CaseCitator } from "./CaseCitator";

type DetailTab = "overview" | "citator";

export function JudgmentDetail() {
  const { selectedCase, setSelectedCase, viewGraph, showToast } = useDashboard();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [detail, setDetail] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCase) return;
    // selectedCase comes from a list fetch (summary only) — load the full
    // detail + citator data before rendering facts/holding/citations.
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetchCaseDetail(selectedCase.id)
      .then((full) => {
        if (!cancelled) setDetail(full);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCase]);

  if (!selectedCase) return null;

  if (loading || !detail) {
    return (
      <div className="page">
        <p className="citator-empty">Loading judgment…</p>
      </div>
    );
  }

  const item = detail;
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

      <div className="jd-tabs">
        <button className={cn("jd-tab", tab === "overview" && "active")} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={cn("jd-tab", tab === "citator" && "active")} onClick={() => setTab("citator")}>
          Citator
        </button>
      </div>

      {tab === "citator" ? (
        <CaseCitator item={item} />
      ) : (
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
              {(item.issues ?? []).map(i => <span className="issue-tag" key={i}>{i}</span>)}
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
          <div className="aside-section-label">Cases cited</div>
          <div className="authority-links">
            {(item.citedCases ?? []).map(c => (
              <button
                key={c.title}
                className="authority-link-btn"
                onClick={() => showToast(`Opened authority trail: ${c.title}.`)}
              >
                {c.title}
              </button>
            ))}
          </div>
          <div className="aside-section-label">Statutes considered</div>
          <div className="authority-links">
            {(item.citedStatutes ?? []).map(s => (
              <button
                key={s.title}
                className="authority-link-btn"
                onClick={() => showToast(`Opened statute: ${s.title}${s.section ? `, ${s.section}` : ""}.`)}
              >
                {s.title}{s.section ? `, ${s.section}` : ""}
              </button>
            ))}
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}
