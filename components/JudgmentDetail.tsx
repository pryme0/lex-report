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
import { CitationGraph } from "./CitationGraph";
import { JudgmentSummaryView } from "./JudgmentSummaryView";
import { JudgmentText } from "./JudgmentText";
import { copyText, judgmentCitation } from "@/lib/judgment";
import { AIChatButton, AIChatPanel } from "./ai-chat";
import { useAIChat } from "@/hooks/useAIChat";
import type { CaseContext } from "./ai-chat/types";

type DetailTab = "judgment" | "summary" | "graph";

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
          aria-label="Open citation graph full screen"
        >
          <Share2 size={12} aria-hidden="true" /> Open full screen
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
  const [chatOpen, setChatOpen] = useState(false);
  const router = useRouter();
  const { showToast } = useDashboard();
  const query = useApiQuery(`case:${caseId}`, () => casesApi.detail(caseId));
  const indexQuery = useApiQuery("cases:index", () => casesApi.index());

  const caseContext: CaseContext = query.data
    ? {
        id: query.data.id,
        title: query.data.title,
        citation: judgmentCitation(query.data),
        court: query.data.court,
        year: query.data.year,
        ratio: query.data.ratio,
        holding: query.data.holding,
      }
    : { id: caseId, title: "Loading...", citation: "", court: "", year: 0, ratio: "", holding: "" };

  const { messages, isLoading, assistantTurn, chatId, sessions, sendMessage, loadChat, startNewChat } = useAIChat({ caseContext });

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
            </header>

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
                className={cn("jd-tab", tab === "summary" && "active")}
                type="button"
                role="tab"
                aria-selected={tab === "summary"}
                onClick={() => setTab("summary")}
              >
                Summary
              </button>
              <button
                className={cn("jd-tab", tab === "graph" && "active")}
                type="button"
                role="tab"
                aria-selected={tab === "graph"}
                onClick={() => setTab("graph")}
              >
                Citation graph
              </button>
            </div>

            {tab === "graph" ? (
              <CitationGraph
                caseId={item.id}
                cases={indexQuery.data ?? []}
                onCaseSelect={(id) => router.push(`/dashboard/cases/${encodeURIComponent(id)}`)}
                onAction={showToast}
              />
            ) : tab === "summary" ? (
              <JudgmentSummaryView item={item} />
            ) : (
              <div className="judgment-reading-panel">
                <JudgmentText
                  fullText={item.fullText}
                  sourcePages={item.sourcePages}
                  citation={judgmentCitation(item)}
                  title={item.title}
                  court={item.court}
                />
              </div>
            )}

            <div className="judgment-print-body" aria-hidden="true">
              <JudgmentText
                fullText={item.fullText}
                sourcePages={item.sourcePages}
                citation={judgmentCitation(item)}
                title={item.title}
                court={item.court}
                print
              />
            </div>
          </>
        )}
      </AsyncSection>

      {variant === "page" && (
        <>
          <AIChatButton isOpen={chatOpen} onClick={() => setChatOpen(!chatOpen)} />
          <AIChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            caseContext={caseContext}
            messages={messages}
            isLoading={isLoading}
            assistantTurn={assistantTurn}
            chatId={chatId}
            sessions={sessions}
            onSend={sendMessage}
            onLoadChat={loadChat}
            onNewChat={startNewChat}
          />
        </>
      )}
    </div>
  );
}
