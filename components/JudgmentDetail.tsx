"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Link2, Printer, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi } from "@/lib/api";
import type { CaseDetail } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection, EmptyState } from "./AsyncState";
import { tcls } from "@/lib/types";
import { CaseCitator } from "./CaseCitator";
import { JudgmentFrontMatter } from "./JudgmentFrontMatter";
import { JudgmentText } from "./JudgmentText";
import { copyText, judgmentCitation } from "@/lib/judgment";
import { statuteHref } from "@/lib/routes";

type DetailTab = "judgment" | "headnote" | "citator";

function HeadnoteView({ item }: { item: CaseDetail }) {
  const router = useRouter();
  const { openCase, showToast } = useDashboard();

  return (
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
      </div>
      <aside className="judgment-aside">
        <dl className="meta-dl">
          <div className="aside-section-label">Report metadata</div>
          <dt>Judges</dt>
          <dd>{item.judges}</dd>
          <dt>Area</dt>
          <dd>{item.area}</dd>
          <dt>Posture</dt>
          <dd>{item.posture}</dd>
          <dt>Strength</dt>
          <dd>{item.strength}%</dd>
        </dl>
        <div className="aside-section-label">Cases cited</div>
        <div className="authority-links">
          {item.citedCases.length === 0 && <p className="citator-empty">None recorded.</p>}
          {item.citedCases.map((c, i) => (
            <button
              key={`${c.caseId ?? "ext"}-${c.title}-${i}`}
              className="authority-link-btn"
              onClick={() =>
                c.caseId
                  ? openCase(c.caseId)
                  : showToast(`${c.title} is not reported in this archive.`)
              }
            >
              {c.title}
              {!c.caseId && <span className="authority-link-note">not in archive</span>}
            </button>
          ))}
        </div>
        <div className="aside-section-label">Statutes considered</div>
        <div className="authority-links">
          {item.citedStatutes.length === 0 && <p className="citator-empty">None recorded.</p>}
          {item.citedStatutes.map((s, i) =>
            s.statuteId ? (
              <button
                key={`${s.statuteId}-${s.section ?? ""}-${i}`}
                className="authority-link-btn"
                onClick={() => router.push(statuteHref(s.statuteId!, s.section))}
              >
                {s.title}
                {s.section ? `, ${s.section}` : ""}
              </button>
            ) : (
              <span key={`${s.title}-${s.section ?? ""}-${i}`}>
                {s.title}
                {s.section ? `, ${s.section}` : ""}
              </span>
            ),
          )}
        </div>
      </aside>
    </div>
  );
}

function JudgmentToolbar({
  caseId,
  item,
  variant,
}: {
  caseId: string;
  item: CaseDetail;
  variant: "overlay" | "page";
}) {
  const router = useRouter();
  const { closeCase, viewGraph, showToast } = useDashboard();
  const permalink = `/dashboard/cases/${encodeURIComponent(caseId)}`;

  const handleCopyCitation = async () => {
    const cite = judgmentCitation(item);
    const ok = await copyText(cite);
    showToast(ok ? "Citation copied to clipboard." : "Could not copy citation.");
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${permalink}`;
    const ok = await copyText(url);
    showToast(ok ? "Permalink copied to clipboard." : "Could not copy link.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="judgment-toolbar">
      <div className="judgment-toolbar-start">
        {variant === "overlay" ? (
          <button className="btn btn-link btn-sm judgment-no-print" type="button" onClick={closeCase}>
            <ArrowLeft size={13} aria-hidden="true" /> Back to results
          </button>
        ) : (
          <button
            className="btn btn-link btn-sm judgment-no-print"
            type="button"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={13} aria-hidden="true" /> Back to research
          </button>
        )}
      </div>
      <div className="judgment-toolbar-actions judgment-no-print">
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={handleCopyCitation}
          aria-label="Copy citation"
        >
          <Copy size={12} aria-hidden="true" /> Copy citation
        </button>
        {variant === "overlay" ? (
          <Link className="btn btn-ghost btn-sm" href={permalink} aria-label="Open permalink">
            <Link2 size={12} aria-hidden="true" /> Open permalink
          </Link>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy permalink"
          >
            <Link2 size={12} aria-hidden="true" /> Copy link
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={handlePrint}
          aria-label="Print judgment"
        >
          <Printer size={12} aria-hidden="true" /> Print
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => viewGraph(caseId)}
          aria-label="View citation graph"
        >
          <Share2 size={12} aria-hidden="true" /> Citation graph
        </button>
      </div>
    </div>
  );
}

function JudgmentNotFound() {
  return (
    <div className="page">
      <EmptyState message="This judgment is not in the archive, or the link may be incorrect." />
      <Link className="btn btn-secondary btn-sm judgment-no-print" href="/dashboard">
        Return to research
      </Link>
    </div>
  );
}

export function JudgmentDetail({
  caseId,
  variant = "overlay",
}: {
  caseId: string;
  variant?: "overlay" | "page";
}) {
  const [tab, setTab] = useState<DetailTab>("judgment");
  const query = useApiQuery(`case:${caseId}`, () => casesApi.detail(caseId));

  useEffect(() => {
    setTab("judgment");
  }, [caseId]);

  if (query.error?.toLowerCase().includes("not found")) {
    return <JudgmentNotFound />;
  }

  return (
    <div className="page judgment-view judgment-print-root" data-judgment-variant={variant}>
      <AsyncSection query={query} loadingLabel="Loading judgment…">
        {(item) => (
          <>
            <div className="judgment-print-header" aria-hidden="true">
              <span className="judgment-print-cite">{judgmentCitation(item)}</span>
              <span className="judgment-print-title">{item.title}</span>
            </div>

            <JudgmentToolbar caseId={caseId} item={item} variant={variant} />

            <header className="judgment-header">
              <div>
                <div className="judgment-court-label">
                  {item.court} · {item.year}
                </div>
                <h1 className="judgment-title">{item.title}</h1>
                <div className="judgment-cite">{judgmentCitation(item)}</div>
              </div>
              <span className={cn("treatment-pill", tcls[item.treatment])}>{item.treatment}</span>
            </header>

            <JudgmentFrontMatter item={item} />

            <div className="jd-tabs judgment-no-print" role="tablist" aria-label="Judgment sections">
              <button
                className={cn("jd-tab", tab === "judgment" && "active")}
                type="button"
                role="tab"
                aria-selected={tab === "judgment"}
                onClick={() => setTab("judgment")}
              >
                Judgment
              </button>
              <button
                className={cn("jd-tab", tab === "headnote" && "active")}
                type="button"
                role="tab"
                aria-selected={tab === "headnote"}
                onClick={() => setTab("headnote")}
              >
                Headnote
              </button>
              <button
                className={cn("jd-tab", tab === "citator" && "active")}
                type="button"
                role="tab"
                aria-selected={tab === "citator"}
                onClick={() => setTab("citator")}
              >
                Citator
              </button>
            </div>

            {tab === "citator" ? (
              <CaseCitator caseId={item.id} />
            ) : tab === "headnote" ? (
              <HeadnoteView item={item} />
            ) : (
              <div className="judgment-reading-panel">
                <JudgmentText
                  fullText={item.fullText}
                  citation={judgmentCitation(item)}
                  title={item.title}
                />
              </div>
            )}

            <div className="judgment-print-body" aria-hidden="true">
              <JudgmentText
                fullText={item.fullText}
                citation={judgmentCitation(item)}
                title={item.title}
                print
              />
            </div>
          </>
        )}
      </AsyncSection>
    </div>
  );
}
