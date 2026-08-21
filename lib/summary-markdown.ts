import { marked, type Token, type Tokens } from "marked";

/**
 * A general-purpose Markdown -> block renderer for editorial prose (the AI-generated case
 * summary), as opposed to lib/judgment-markdown.ts which parses judgment body text and applies
 * judgment-specific heuristics (paragraph numbering, opinion/coram detection) that would misfire
 * on ordinary headed prose like "## Applicable Law" or "### Cases Cited".
 */

export type SummaryInline =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: SummaryInline[] }
  | { kind: "em"; children: SummaryInline[] }
  | { kind: "code"; text: string };

export type SummaryBlock =
  | { kind: "heading"; level: 2 | 3 | 4; text: string; id: string }
  | { kind: "paragraph"; children: SummaryInline[] }
  | { kind: "list"; ordered: boolean; items: SummaryInline[][] }
  | { kind: "rule" };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inlineFrom(tokens: Token[] | undefined): SummaryInline[] {
  if (!tokens) return [];
  const out: SummaryInline[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "strong":
        out.push({ kind: "strong", children: inlineFrom((token as Tokens.Strong).tokens) });
        break;
      case "em":
        out.push({ kind: "em", children: inlineFrom((token as Tokens.Em).tokens) });
        break;
      case "codespan":
        out.push({ kind: "code", text: (token as Tokens.Codespan).text });
        break;
      case "br":
        out.push({ kind: "text", text: " " });
        break;
      default: {
        const text = (token as Tokens.Text).text ?? (token as { raw?: string }).raw;
        if (text) out.push({ kind: "text", text });
      }
    }
  }
  return out;
}

function flattenListItem(item: Tokens.ListItem): Token[] {
  const out: Token[] = [];
  for (const token of item.tokens) {
    if (token.type === "text" && (token as Tokens.Text).tokens) {
      out.push(...((token as Tokens.Text).tokens as Token[]));
    } else if (token.type === "paragraph") {
      out.push(...((token as Tokens.Paragraph).tokens as Token[]));
    } else {
      out.push(token);
    }
  }
  return out;
}

export function parseSummaryMarkdown(text: string): SummaryBlock[] {
  const source = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) return [];

  const blocks: SummaryBlock[] = [];
  const usedIds = new Set<string>();
  const uniqueId = (base: string) => {
    const seed = base || "section";
    if (!usedIds.has(seed)) {
      usedIds.add(seed);
      return seed;
    }
    let n = 2;
    while (usedIds.has(`${seed}-${n}`)) n += 1;
    usedIds.add(`${seed}-${n}`);
    return `${seed}-${n}`;
  };

  for (const token of marked.lexer(source, { gfm: true, breaks: false })) {
    switch (token.type) {
      case "heading": {
        const heading = token as Tokens.Heading;
        const plain = inlineFrom(heading.tokens)
          .map((n) => (n.kind === "text" || n.kind === "code" ? n.text : ""))
          .join("");
        const text = plain.trim();
        if (!text) break;
        const level = Math.min(Math.max(heading.depth, 2), 4) as 2 | 3 | 4;
        blocks.push({ kind: "heading", level, text, id: uniqueId(slugify(text)) });
        break;
      }
      case "paragraph":
        blocks.push({ kind: "paragraph", children: inlineFrom((token as Tokens.Paragraph).tokens) });
        break;
      case "list": {
        const list = token as Tokens.List;
        const items = list.items.map((item) => inlineFrom(flattenListItem(item)));
        if (items.length > 0) blocks.push({ kind: "list", ordered: list.ordered, items });
        break;
      }
      case "hr":
        blocks.push({ kind: "rule" });
        break;
      default:
        break;
    }
  }

  return blocks;
}
