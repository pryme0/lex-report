"use client";

import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi } from "@/lib/api";
import type { Citator } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection } from "./AsyncState";
import type { Standing } from "@/lib/types";
import { tcls } from "@/lib/types";
import { cn } from "@/lib/utils";

const standingCls: Record<Standing, string> = {
  "Good Law": "good-law-good",
  "Cautionary": "good-law-caution",
  "Bad Law": "good-law-bad",
};

function formatReviewedAt(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CitatorView({ data }: { data: Citator }) {
  const { openCase } = useDashboard();
  const reviewedAt = formatReviewedAt(data.reviewedAt);

  return (
    <div className="citator">
      <section className="citator-standing-block" aria-labelledby="citator-standing-heading">
        <h3 id="citator-standing-heading" className="citator-section-title">
          Standing signal
        </h3>
        <div className="citator-standing-row">
          <span className={cn("standing-badge", standingCls[data.standing])}>{data.standing}</span>
        </div>
        <p className="citator-standing-basis">{data.standingBasis}</p>
        {reviewedAt && (
          <p className="citator-asat">
            Editorial review as at {reviewedAt}. Verify against the certified judgment before
            filing.
          </p>
        )}
      </section>

      {data.standingNotes.length > 0 && (
        <section className="citator-section" aria-labelledby="citator-notes-heading">
          <h3 id="citator-notes-heading" className="citator-section-title">
            Recorded, but not affecting standing
          </h3>
          <p className="citator-section-desc">
            Negative treatments from courts below are held on record with the reason they did not
            move the standing signal.
          </p>
          <div className="citator-notes">
            {data.standingNotes.map((n, i) => (
              <div className="citator-note-row" key={`${n.citation}-${n.treatment}-${i}`}>
                <div>
                  <div className="citator-citing-title">{n.title}</div>
                  <div className="citator-citing-cite">
                    {n.citation}
                    {n.court ? ` · ${n.court}` : ""}
                  </div>
                  <p className="citator-note-reason">{n.reason}</p>
                </div>
                <span className={cn("treatment-pill", tcls[n.treatment])}>{n.treatment}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="citator-section" aria-labelledby="citator-history-heading">
        <h3 id="citator-history-heading" className="citator-section-title">
          Appeal trail
        </h3>
        {data.directHistory.length === 0 ? (
          <p className="citator-empty">
            No prior appeal history on record — this is the first-instance decision.
          </p>
        ) : (
          <ol className="citator-appeal-trail">
            {data.directHistory.map((h, index) => (
              <li className="citator-appeal-step" key={`${h.citation}-${h.year}-${index}`}>
                <span className="citator-appeal-marker" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="citator-appeal-body">
                  <div className="citator-appeal-court">
                    {h.court} · {h.year}
                  </div>
                  <div className="citator-appeal-cite">{h.citation}</div>
                  <span className={cn("history-outcome", h.outcome.toLowerCase())}>
                    {h.outcome}
                  </span>
                </div>
              </li>
            ))}
            <li className="citator-appeal-step citator-appeal-step--current" aria-current="step">
              <span className="citator-appeal-marker" aria-hidden="true">
                {data.directHistory.length + 1}
              </span>
              <div className="citator-appeal-body">
                <div className="citator-appeal-court">This report</div>
                <div className="citator-appeal-cite">Current judgment</div>
              </div>
            </li>
          </ol>
        )}
      </section>

      <section className="citator-section" aria-labelledby="citator-citing-heading">
        <div className="citator-section-header">
          <h3 id="citator-citing-heading" className="citator-section-title">
            Citing treatment
          </h3>
          {data.citingCount > 0 && (
            <span className="citator-count">
              {data.citingCount} case{data.citingCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {data.citingCases.length === 0 ? (
          <p className="citator-empty">No later case has cited this judgment yet.</p>
        ) : (
          <div className="citator-citing-list">
            {data.citingCases.map((c, i) => {
              const row = (
                <>
                  <div>
                    <div className="citator-citing-title">{c.title}</div>
                    <div className="citator-citing-cite">
                      {c.citation} · {c.year}
                      {c.court ? ` · ${c.court}` : ""}
                    </div>
                  </div>
                  <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                </>
              );
              const key = `${c.caseId ?? "ext"}-${c.citation}-${c.title}-${i}`;

              return c.caseId ? (
                <button
                  type="button"
                  className="citator-citing-row"
                  key={key}
                  onClick={() => openCase(c.caseId!)}
                >
                  {row}
                </button>
              ) : (
                <div className="citator-citing-row" key={key}>
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function CaseCitator({ caseId }: { caseId: string }) {
  const query = useApiQuery(`citator:${caseId}`, () => casesApi.citator(caseId));

  return (
    <AsyncSection query={query} loadingLabel="Checking citator…">
      {(data) => <CitatorView data={data} />}
    </AsyncSection>
  );
}
