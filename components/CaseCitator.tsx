"use client";

import { CaseItem, Standing, deriveStanding, tcls } from "@/lib/types";
import { cn } from "@/lib/utils";

const standingCls: Record<Standing, string> = {
  "Good Law": "good-law-good",
  "Cautionary": "good-law-caution",
  "Bad Law": "good-law-bad",
};

const standingNote: Record<Standing, string> = {
  "Good Law": "No negative treatment on record — safe to rely on as it stands.",
  "Cautionary": "Later courts have distinguished or questioned parts of this ratio — read the citing cases before relying on it.",
  "Bad Law": "This case has since been overruled.",
};

export function CaseCitator({ item }: { item: CaseItem }) {
  const directHistory = item.directHistory ?? [];
  const citingCases = item.citingCases ?? [];
  const standing = deriveStanding(citingCases);

  return (
    <div className="citator">
      <div className="citator-standing-row">
        <span className={cn("standing-badge", standingCls[standing])}>{standing}</span>
        <span className="citator-standing-note">{standingNote[standing]}</span>
      </div>

      <div className="citator-section">
        <div className="aside-section-label" style={{ marginTop: 0 }}>Direct history</div>
        {directHistory.length === 0 ? (
          <p className="citator-empty">No prior appeal history on record — this is the first-instance decision.</p>
        ) : (
          <ol className="citator-history">
            {directHistory.map(h => (
              <li className="citator-history-row" key={h.citation}>
                <span className="citator-history-court">{h.court} · {h.year}</span>
                <span className={cn("history-outcome", h.outcome.toLowerCase())}>{h.outcome}</span>
                <span className="citator-history-cite">{h.citation}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="citator-section">
        <div className="citator-section-header">
          <div className="aside-section-label" style={{ margin: 0 }}>Citing treatment</div>
          {citingCases.length > 0 && (
            <span className="citator-count">
              {citingCases.length} case{citingCases.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {citingCases.length === 0 ? (
          <p className="citator-empty">No later case has cited this judgment yet.</p>
        ) : (
          <div className="citator-citing-list">
            {citingCases.map(c => (
              <div className="citator-citing-row" key={c.citation}>
                <div>
                  <div className="citator-citing-title">{c.title}</div>
                  <div className="citator-citing-cite">{c.citation} · {c.year}</div>
                </div>
                <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
