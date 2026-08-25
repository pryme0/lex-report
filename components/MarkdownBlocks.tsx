import { Fragment } from "react";
import type { SummaryBlock, SummaryInline } from "@/lib/summary-markdown";

/**
 * Renders the block tree from lib/summary-markdown.ts as plain semantic JSX (h2-h4, p, ul/ol,
 * hr) — no className baked in, so each caller's own CSS (descendant selectors off whatever
 * wrapper it renders this inside) controls the look. Shared by JudgmentSummaryView (case
 * summaries) and AIMessage (Lex chat / search-page AI answers) so both get real markdown
 * structure instead of a regex-based approximation, without duplicating the tree-walk twice.
 */
export function Inline({ nodes }: { nodes: SummaryInline[] }) {
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
            return <code key={i}>{node.text}</code>;
          default:
            return <Fragment key={i}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}

export function MarkdownBlocks({ blocks }: { blocks: SummaryBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case "heading": {
            const Tag = (["h2", "h3", "h4"] as const)[block.level - 2];
            return <Tag key={key}>{block.text}</Tag>;
          }
          case "paragraph":
            return (
              <p key={key}>
                <Inline nodes={block.children} />
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={key}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline nodes={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "rule":
            return <hr key={key} />;
        }
      })}
    </>
  );
}
