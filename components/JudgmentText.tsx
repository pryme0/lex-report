"use client";

import { Link as LinkIcon } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { copyText, judgeAnchorId, parseJudgmentText, type JudgmentBlock } from "@/lib/judgment";
import { cn } from "@/lib/utils";

type JudgeBlock = Extract<JudgmentBlock, { kind: "judge" }>;

export function JudgmentText({
  fullText,
  citation,
}: {
  fullText: string;
  /** Case citation, used to build a copyable pinpoint reference like "(2026) 4 LRR 1 at para 12". */
  citation?: string;
}) {
  const { showToast } = useDashboard();
  const blocks = parseJudgmentText(fullText);
  const opinions: { block: JudgeBlock; index: number }[] = blocks
    .map((block, index) => ({ block, index }))
    .filter((entry): entry is { block: JudgeBlock; index: number } => entry.block.kind === "judge");

  async function copyPinpoint(paragraph: string) {
    const reference = citation ? `${citation} at para ${paragraph}` : `Para ${paragraph}`;
    const ok = await copyText(reference);
    showToast(ok ? `Copied "${reference}".` : "Could not copy citation.");
  }

  return (
    <div className={cn("judgment-text-layout", opinions.length > 1 && "has-outline")}>
      {opinions.length > 1 && (
        <nav className="judgment-outline judgment-no-print" aria-label="Opinions in this judgment">
          <div className="judgment-outline-label">In this judgment</div>
          <ol className="judgment-outline-list">
            {opinions.map(({ block, index }) => (
              <li key={judgeAnchorId(block.judge, index)}>
                <a href={`#${judgeAnchorId(block.judge, index)}`} className="judgment-outline-link">
                  <span className={cn("judgment-outline-badge", block.isLead && "is-lead")}>
                    {block.isLead ? "Lead" : "Concurring"}
                  </span>
                  <span className="judgment-outline-name">{block.judge}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <article className="judgment-text" aria-label="Full judgment">
        {blocks.map((block, index) => {
          const key = `${block.kind}-${index}`;

          if (block.kind === "heading") {
            return (
              <h3 className="judgment-text-heading" key={key}>
                {block.text}
              </h3>
            );
          }

          if (block.kind === "judge") {
            return (
              <div
                id={judgeAnchorId(block.judge, index)}
                className={cn(
                  "judgment-text-judge-block",
                  block.isLead ? "is-lead" : "is-concurring",
                )}
                key={key}
              >
                <span className={cn("judgment-outline-badge", block.isLead && "is-lead")}>
                  {block.isLead ? "Lead judgment" : "Concurring"}
                </span>
                <h4 className="judgment-text-judge">
                  {block.judge}
                  {block.text ? `: ${block.text}` : ""}
                </h4>
              </div>
            );
          }

          if (block.kind === "numbered") {
            return (
              <p
                id={`para-${block.number}`}
                className="judgment-text-para judgment-text-para--numbered"
                key={key}
              >
                <button
                  type="button"
                  className="judgment-para-num judgment-no-print"
                  onClick={() => copyPinpoint(block.number)}
                  aria-label={`Copy pinpoint citation for paragraph ${block.number}`}
                  title={`Copy pinpoint citation for paragraph ${block.number}`}
                >
                  {block.number}.
                  <LinkIcon size={10} className="judgment-para-num-icon" aria-hidden="true" />
                </button>
                <span className="judgment-para-num judgment-print-only" aria-hidden="true">
                  {block.number}.
                </span>
                {block.text}
              </p>
            );
          }

          return (
            <p className="judgment-text-para" key={key}>
              {block.text}
            </p>
          );
        })}
      </article>
    </div>
  );
}
