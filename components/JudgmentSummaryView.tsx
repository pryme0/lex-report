"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  BookMarked,
  Check,
  Copy as CopyIcon,
  Gavel,
  Landmark,
  Sparkles,
} from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import type { CaseDetail } from "@/lib/api";
import { copyText } from "@/lib/judgment";
import { parseSummaryMarkdown, type SummaryBlock, type SummaryInline } from "@/lib/summary-markdown";
import { SimilarCases } from "./SimilarCases";

const HEADING_NUMBER_RE = /^(\d{1,2})[.)]\s*(.+)$/;

function Inline({ nodes }: { nodes: SummaryInline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.kind) {
          case "strong":
            return (
              <strong key={i}>
                <Inline nodes={node.children} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <Inline nodes={node.children} />
              </em>
            );
          case "code":
            return (
              <code key={i} className="judgment-code">
                {node.text}
              </code>
            );
          default:
            return <Fragment key={i}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}

function SummaryBlocks({ blocks }: { blocks: SummaryBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case "heading": {
            const Tag = (["h2", "h3", "h4"] as const)[block.level - 2];
            const match = block.level === 2 ? HEADING_NUMBER_RE.exec(block.text) : null;
            return (
              <Tag key={key} id={block.id} className={`summary-heading summary-heading--h${block.level}`}>
                {match ? (
                  <>
                    <span className="summary-heading-num" aria-hidden="true">
                      {match[1]}
                    </span>
                    {match[2]}
                  </>
                ) : (
                  block.text
                )}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="summary-para">
                <Inline nodes={block.children} />
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={key} className="summary-list">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline nodes={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "rule":
            return <hr key={key} className="summary-rule" />;
        }
      })}
    </>
  );
}

function SummaryOutline({ blocks }: { blocks: SummaryBlock[] }) {
  const entries = blocks.filter(
    (b): b is Extract<SummaryBlock, { kind: "heading" }> => b.kind === "heading" && b.level === 2,
  );
  if (entries.length === 0) return null;

  return (
    <nav className="summary-outline judgment-no-print" aria-label="Summary sections">
      {entries.map((entry) => {
        const match = HEADING_NUMBER_RE.exec(entry.text);
        return (
          <a key={entry.id} href={`#${entry.id}`} className="summary-outline-link">
            {match ? match[2] : entry.text}
          </a>
        );
      })}
    </nav>
  );
}

function SideCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="summary-card">
      <div className="summary-card-label">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

// Extract a section from the summary markdown by heading
function extractSummarySection(summary: string, sectionName: string): string | null {
  if (!summary) return null;

  // Match section heading (with or without number prefix) and capture content until next heading
  const patterns = [
    new RegExp(`(?:^|\\n)(?:\\d+[.)]\\s*)?\\*\\*${sectionName}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n(?:\\d+[.)]\\s*)?\\*\\*|$)`, 'i'),
    new RegExp(`(?:^|\\n)(?:\\d+[.)]\\s*)?${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n(?:\\d+[.)]\\s*)?\\*\\*|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted content
      return match[1]
        .trim()
        .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start
        .split('\n')
        .slice(0, 5) // Limit to first 5 lines for sidebar
        .join('\n')
        .trim();
    }
  }
  return null;
}

export function JudgmentSummaryView({ item }: { item: CaseDetail }) {
  const { showToast } = useDashboard();
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(() => parseSummaryMarkdown(item.summary), [item.summary]);
  const hasSummary = !!item.summary?.trim();

  const handleCopy = async () => {
    const ok = await copyText(item.summary);
    setCopied(ok);
    showToast(ok ? "Summary copied to clipboard." : "Could not copy summary.");
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="summary-view">
      <div className="summary-banner">
        <div className="summary-banner-label">
          <Sparkles size={13} aria-hidden="true" />
          <span>AI-generated case summary</span>
        </div>
        <p className="summary-banner-note">
          Structured from the full judgment for quick review — verify against the reported text
          before filing or relying on it.
        </p>
        {hasSummary && (
          <button type="button" className="btn btn-ghost btn-sm summary-copy-btn judgment-no-print" onClick={handleCopy}>
            {copied ? <Check size={12} aria-hidden="true" /> : <CopyIcon size={12} aria-hidden="true" />}
            {copied ? "Copied" : "Copy summary"}
          </button>
        )}
      </div>

      <div className="judgment-cols summary-cols">
        <div className="summary-body-col">
          {hasSummary ? (
            <>
              <SummaryOutline blocks={blocks} />
              <div className="judgment-body summary-body">
                <SummaryBlocks blocks={blocks} />
              </div>
            </>
          ) : (
            <div className="summary-empty">
              <Sparkles size={18} aria-hidden="true" />
              <p>No AI-generated summary has been produced for this judgment yet.</p>
            </div>
          )}
        </div>
        <aside className="judgment-aside summary-aside">
          {hasSummary && (
            <>
              <SideCard icon={<Landmark size={13} aria-hidden="true" />} label="Applicable law">
                <p className="summary-side-text">
                  {extractSummarySection(item.summary, "Applicable Law") || "See summary for applicable law."}
                </p>
              </SideCard>
              <SideCard icon={<BookMarked size={13} aria-hidden="true" />} label="Facts of the case">
                <p className="summary-side-text">
                  {extractSummarySection(item.summary, "Material Facts") || extractSummarySection(item.summary, "Facts of the Case") || item.facts || "See summary for case facts."}
                </p>
              </SideCard>
              <SideCard icon={<Gavel size={13} aria-hidden="true" />} label="Key legal principles">
                <p className="summary-side-text">
                  {extractSummarySection(item.summary, "Key Legal Principles") || item.ratio || item.ratioDecidendi || "See summary for key principles."}
                </p>
              </SideCard>
            </>
          )}
          <SimilarCases caseId={item.id} />
        </aside>
      </div>
    </div>
  );
}
