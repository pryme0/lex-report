"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookMarked,
  Check,
  Copy as CopyIcon,
  FileText,
  Gavel,
  Landmark,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/contexts/DashboardContext";
import type { CaseDetail } from "@/lib/api";
import { copyText } from "@/lib/judgment";
import { statuteHref } from "@/lib/routes";
import { parseSummaryMarkdown, type SummaryBlock, type SummaryInline } from "@/lib/summary-markdown";
import { Inline as MarkdownInline } from "./MarkdownBlocks";
import { SimilarCases } from "./SimilarCases";

const HEADING_NUMBER_RE = /^(\d{1,2})[.)]\s*(.+)$/;

// This page's CSS keys off .judgment-code / .summary-heading etc., so it keeps its own block
// renderer (with those classNames and the numbered-heading treatment) rather than the plain,
// class-free one in MarkdownBlocks.tsx — but reuses that module's Inline for the shared
// strong/em/code/text walk.
function Inline({ nodes }: { nodes: SummaryInline[] }) {
  return (
    <>
      {nodes.map((node, i) =>
        node.kind === "code" ? (
          <code key={i} className="judgment-code">
            {node.text}
          </code>
        ) : (
          <MarkdownInline key={i} nodes={[node]} />
        ),
      )}
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

function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pulls the blocks under whichever "## " heading in the parsed summary matches one of the given
 * name variants — e.g. the summarizer prompt's canonical "Material Facts of the Case" heading
 * (see gemini-judgment-summarizer.service.ts) for a card labelled just "Facts of the case". Match
 * is substring-based against a normalized heading, since the model doesn't always use the exact
 * canonical wording verbatim. Stops at the next heading of any level, which correctly bounds
 * every section this is used for (none of them nest a "### " subheading of their own).
 */
function extractSummarySection(blocks: SummaryBlock[], nameVariants: string[]): SummaryBlock[] {
  const variants = nameVariants.map(normalizeHeading);
  const startIndex = blocks.findIndex((b) => {
    if (b.kind !== "heading") return false;
    const heading = normalizeHeading(b.text);
    return variants.some((v) => heading.includes(v));
  });
  if (startIndex === -1) return [];

  const section: SummaryBlock[] = [];
  for (let i = startIndex + 1; i < blocks.length && blocks[i].kind !== "heading"; i++) {
    section.push(blocks[i]);
  }
  return section;
}

/** Renders an extracted section at the smaller side-card text size, falling back to plain text
 * (a legacy field, or a stock "not stated" message) when the summary has no matching heading —
 * older summaries predate the current heading set, so this keeps those cases readable too. */
function ExtractedSection({ blocks, fallback }: { blocks: SummaryBlock[]; fallback: string }) {
  if (blocks.length === 0) {
    return <p className="summary-side-text">{fallback}</p>;
  }
  return (
    <div className="summary-side-text">
      <SummaryBlocks blocks={blocks} />
    </div>
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

function CitedCasesCard({ item }: { item: CaseDetail }) {
  const { openCase, showToast } = useDashboard();

  return (
    <SideCard icon={<BookMarked size={13} aria-hidden="true" />} label="Cases cited">
      {item.citedCases.length === 0 ? (
        <p className="citator-empty">None recorded.</p>
      ) : (
        <div className="authority-links">
          {item.citedCases.map((c, i) => (
            <button
              key={`${c.caseId ?? "ext"}-${c.title}-${i}`}
              className="authority-link-btn"
              onClick={() =>
                c.caseId ? openCase(c.caseId) : showToast(`${c.title} is not reported in this archive.`)
              }
            >
              {c.title}
              {!c.caseId && <span className="authority-link-note">not in archive</span>}
            </button>
          ))}
        </div>
      )}
    </SideCard>
  );
}

/** Applicable law, primarily as prose extracted from the summary's own "Applicable Law" section
 * (see extractSummarySection) — falling back to the structured cited-statutes list (with links
 * into the legislation library) only when the summary has no such section to draw from. */
function ApplicableLawsCard({ item, sectionBlocks }: { item: CaseDetail; sectionBlocks: SummaryBlock[] }) {
  const router = useRouter();

  if (sectionBlocks.length > 0) {
    return (
      <SideCard icon={<Landmark size={13} aria-hidden="true" />} label="Applicable laws">
        <div className="summary-side-text">
          <SummaryBlocks blocks={sectionBlocks} />
        </div>
      </SideCard>
    );
  }

  return (
    <SideCard icon={<Landmark size={13} aria-hidden="true" />} label="Applicable laws">
      {item.citedStatutes.length === 0 ? (
        <p className="citator-empty">None recorded.</p>
      ) : (
        <div className="authority-links">
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
              <span key={`${s.title}-${s.section ?? ""}-${i}`} className="authority-link-static">
                {s.title}
                {s.section ? `, ${s.section}` : ""}
              </span>
            ),
          )}
        </div>
      )}
    </SideCard>
  );
}

export function JudgmentSummaryView({ item }: { item: CaseDetail }) {
  const { showToast } = useDashboard();
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(() => parseSummaryMarkdown(item.summary), [item.summary]);
  const hasSummary = !!item.summary?.trim();

  // Pulled from the summary's own headed sections (see extractSummarySection) rather than the
  // separate facts/holding/citedStatutes fields — those can be shorter or older than what the
  // summary itself says under its "Material Facts", "Applicable Law", and "Decision / Holding"
  // headings, which is the text a reader is actually looking at just to the left of these cards.
  const factsSection = useMemo(
    () => extractSummarySection(blocks, ["material facts of the case", "facts of the case", "facts"]),
    [blocks],
  );
  const lawSection = useMemo(
    () => extractSummarySection(blocks, ["applicable law", "applicable legislation"]),
    [blocks],
  );
  const decisionSection = useMemo(
    () =>
      extractSummarySection(blocks, [
        "decision / holding of the court",
        "decision/holding of the court",
        "decision and holding",
        "decision",
        "holding",
      ]),
    [blocks],
  );

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
              <SideCard icon={<FileText size={13} aria-hidden="true" />} label="Facts of the case">
                <ExtractedSection
                  blocks={factsSection}
                  fallback={item.facts || "Not expressly stated in the judgment."}
                />
              </SideCard>
              <ApplicableLawsCard item={item} sectionBlocks={lawSection} />
              <SideCard icon={<Gavel size={13} aria-hidden="true" />} label="Decision / holding of the court">
                <ExtractedSection
                  blocks={decisionSection}
                  fallback={item.holding || "Not expressly stated in the judgment."}
                />
              </SideCard>
              {item.issuesDetermined.length > 0 && (
                <SideCard icon={<ListChecks size={13} aria-hidden="true" />} label="Issues determined">
                  <ol className="judgment-issues-list">
                    {item.issuesDetermined.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ol>
                </SideCard>
              )}
            </>
          )}
          <SimilarCases caseId={item.id} />
          <CitedCasesCard item={item} />
        </aside>
      </div>
    </div>
  );
}
