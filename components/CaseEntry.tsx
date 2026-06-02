"use client";

import { Clock, TrendingUp, ArrowRight, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import type { CaseItem } from "@/lib/types";
import { tcls } from "@/lib/types";

export function CaseEntry({ item }: { item: CaseItem }) {
  const { setSelectedCase, viewGraph, showToast } = useDashboard();
  const t = tcls[item.treatment];

  return (
    <div className={cn("case-entry", t)}>
      <div className="case-entry-head">
        <span className="case-court-year">{item.court} · {item.year}</span>
        <span className={cn("treatment-pill", t)}>{item.treatment}</span>
      </div>
      <button className="case-title-btn" onClick={() => setSelectedCase(item)}>
        <h3>{item.title}</h3>
      </button>
      <div className="case-citation">{item.citation}</div>
      <p className="case-ratio">{item.ratio}</p>
      <div className="case-meta">
        <span className="case-tag">{item.area}</span>
        <span className="case-tag">{item.posture}</span>
        <span className="case-tag"><Clock size={10} /> {item.readTime}</span>
        <span className="case-tag"><TrendingUp size={10} /> {item.strength}%</span>
      </div>
      <div className="case-actions">
        <button className="btn btn-primary btn-sm" onClick={() => setSelectedCase(item)}>
          Open judgment <ArrowRight size={12} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => viewGraph(item)}>
          <Share2 size={12} /> Citation graph
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => showToast(`${item.citation} saved to your active matter.`)}>
          Save to matter
        </button>
      </div>
    </div>
  );
}
