import { marked, type Token, type Tokens } from "marked";

export type InlineNode =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: InlineNode[] }
  | { kind: "em"; children: InlineNode[] }
  | { kind: "del"; children: InlineNode[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; children: InlineNode[] }
  | { kind: "break" };

export type OpinionRole = "lead" | "concurring" | "dissenting";

export type JudgmentBlock =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string; id: string }
  | { kind: "opinion"; id: string; judge: string; qualifier: string; role: OpinionRole }
  | { kind: "coram"; text: string }
  | { kind: "paragraph"; number: string | null; children: InlineNode[] }
  | { kind: "quote"; blocks: JudgmentBlock[] }
  | { kind: "list"; ordered: false; items: InlineNode[][] }
  | { kind: "rule" };

export type OutlineEntry = {
  id: string;
  label: string;
  detail?: string;
  type: "section" | "opinion";
  role?: OpinionRole;
};

export type ParsedJudgment = {
  blocks: JudgmentBlock[];
  outline: OutlineEntry[];
  paragraphCount: number;
};

const JUDGE_HEADING_RE =
  /^([A-Z][A-Za-z.\-' ]*(?:,\s*)?(?:J\.?S\.?C\.?|J\.?C\.?A\.?|C\.?J\.?N\.?|P\.?C\.?A\.?|J\.?)\.?)\s*(?:[(:]\s*(.*?)\s*\)?)?:?\s*$/;

const LEADING_NUMBER_RE = /^(\d{1,4})[.)]\s+/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function opinionRole(qualifier: string): OpinionRole {
  if (/dissent/i.test(qualifier)) return "dissenting";
  if (/lead/i.test(qualifier)) return "lead";
  return "concurring";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function mergeAdjacentText(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (node.kind === "text" && prev?.kind === "text") {
      out[out.length - 1] = { kind: "text", text: prev.text + node.text };
    } else {
      out.push(node);
    }
  }
  return out;
}

function inlineFrom(tokens: Token[] | undefined): InlineNode[] {
  if (!tokens) return [];
  const out: InlineNode[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "strong":
        out.push({ kind: "strong", children: inlineFrom((token as Tokens.Strong).tokens) });
        break;
      case "em":
        out.push({ kind: "em", children: inlineFrom((token as Tokens.Em).tokens) });
        break;
      case "del":
        out.push({ kind: "del", children: inlineFrom((token as Tokens.Del).tokens) });
        break;
      case "codespan":
        out.push({ kind: "code", text: decodeEntities((token as Tokens.Codespan).text) });
        break;
      case "link": {
        const link = token as Tokens.Link;
        out.push({ kind: "link", href: link.href, children: inlineFrom(link.tokens) });
        break;
      }
      case "br":
        out.push({ kind: "break" });
        break;
      case "escape":
      case "text":
      case "html":
        out.push({ kind: "text", text: decodeEntities((token as Tokens.Text).text) });
        break;
      default: {
        const raw = (token as { raw?: string }).raw;
        if (raw) out.push({ kind: "text", text: raw });
      }
    }
  }

  return mergeAdjacentText(out);
}

function inlineToPlainText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
        case "code":
          return node.text;
        case "break":
          return " ";
        default:
          return inlineToPlainText(node.children);
      }
    })
    .join("");
}

/** A citation that wrapped mid-line in the source PDF — "(2015) 8 NWLR (Pt." ending one line,
 * "1278) 236." starting the next — lands as its own paragraph with exactly the same leading
 * "digits + `.`/`)`" shape as a real numbered paragraph ("1278.  The court held..."). The two are
 * told apart by what follows the number: real paragraph prose reads as a sentence (capitalised,
 * more than a couple of words); a citation's tail is a bare page number or short fragment. */
function looksLikeParagraphProse(text: string): boolean {
  const trimmed = text.replace(/^[\s"'“”([]+/, "");
  return trimmed.length >= 8 && /^[A-Z]/.test(trimmed);
}

function splitLeadingNumber(children: InlineNode[]): { number: string | null; children: InlineNode[] } {
  const first = children[0];
  if (first?.kind !== "text") return { number: null, children };

  const match = first.text.match(LEADING_NUMBER_RE);
  if (!match) return { number: null, children };

  const rest = first.text.slice(match[0].length);
  if (rest ? !looksLikeParagraphProse(rest) : children.length <= 1) {
    return { number: null, children };
  }

  const remainder: InlineNode[] = rest
    ? [{ kind: "text", text: rest }, ...children.slice(1)]
    : children.slice(1);
  return { number: match[1], children: remainder };
}

type ParseContext = {
  blocks: JudgmentBlock[];
  outline: OutlineEntry[];
  usedIds: Set<string>;
  paragraphNumbers: Set<string>;
  title?: string;
};

function uniqueId(ctx: ParseContext, base: string): string {
  const seed = base || "section";
  if (!ctx.usedIds.has(seed)) {
    ctx.usedIds.add(seed);
    return seed;
  }
  let n = 2;
  while (ctx.usedIds.has(`${seed}-${n}`)) n += 1;
  const id = `${seed}-${n}`;
  ctx.usedIds.add(id);
  return id;
}

function pushHeading(ctx: ParseContext, token: Tokens.Heading) {
  const text = inlineToPlainText(inlineFrom(token.tokens)).trim();
  if (!text) return;

  if (token.depth === 1 && (!ctx.title || slugify(text) === slugify(ctx.title))) return;

  const judge = JUDGE_HEADING_RE.exec(text);
  if (judge && token.depth >= 3) {
    const name = judge[1].replace(/[,\s]+$/, "").trim();
    const qualifier = (judge[2] ?? "").replace(/[)\s]+$/, "").trim();
    const role = opinionRole(qualifier);
    const id = uniqueId(ctx, `opinion-${slugify(name)}`);
    ctx.blocks.push({ kind: "opinion", id, judge: name, qualifier, role });
    ctx.outline.push({ id, label: name, detail: qualifier || undefined, type: "opinion", role });
    return;
  }

  const level = Math.min(Math.max(token.depth, 1), 4) as 1 | 2 | 3 | 4;
  const id = uniqueId(ctx, `section-${slugify(text)}`);
  ctx.blocks.push({ kind: "heading", level, text, id });
  if (level <= 2) ctx.outline.push({ id, label: text, type: "section" });
}

function pushParagraph(ctx: ParseContext, children: InlineNode[], explicitNumber?: string) {
  if (children.length === 0) return;

  const first = children[0];
  if (
    !explicitNumber &&
    first?.kind === "strong" &&
    /^coram:?$/i.test(inlineToPlainText(first.children).trim())
  ) {
    const text = inlineToPlainText(children.slice(1)).replace(/^[:\s]+/, "").trim();
    if (text) {
      ctx.blocks.push({ kind: "coram", text });
      return;
    }
  }

  const { number, children: body } =
    explicitNumber !== undefined
      ? { number: explicitNumber, children }
      : splitLeadingNumber(children);

  if (body.length === 0) return;

  const anchorNumber = number && !ctx.paragraphNumbers.has(number) ? number : null;
  if (anchorNumber) ctx.paragraphNumbers.add(anchorNumber);

  ctx.blocks.push({ kind: "paragraph", number: anchorNumber ?? number, children: body });
}

function flattenItemTokens(item: Tokens.ListItem): Token[] {
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

function pushListItemAsParagraphs(ctx: ParseContext, item: Tokens.ListItem, number: string) {
  const inner: ParseContext = { ...ctx, blocks: [] };
  walk(inner, item.tokens);

  if (inner.blocks.length === 0) return;

  const [first, ...rest] = inner.blocks;
  // "NNNN) " at the start of a line is also valid Markdown ordered-list syntax, so a wrapped
  // citation tail like "1223) 547, 599 (SC); Olaanimashaun..." parses as a genuine one-item list
  // rather than hitting the plain-paragraph path splitLeadingNumber guards — same false-positive,
  // different route in, so it needs the same prose check before trusting `number`.
  const looksReal =
    first.kind === "paragraph" && looksLikeParagraphProse(inlineToPlainText(first.children));
  if (first.kind === "paragraph" && first.number === null && looksReal) {
    const anchorNumber = ctx.paragraphNumbers.has(number) ? null : number;
    if (anchorNumber) ctx.paragraphNumbers.add(anchorNumber);
    ctx.blocks.push({ ...first, number: anchorNumber ?? number });
  } else {
    ctx.blocks.push(first);
  }
  ctx.blocks.push(...rest);
}

function walk(ctx: ParseContext, tokens: Token[]) {
  for (const token of tokens) {
    switch (token.type) {
      case "heading":
        pushHeading(ctx, token as Tokens.Heading);
        break;

      case "paragraph":
        pushParagraph(ctx, inlineFrom((token as Tokens.Paragraph).tokens));
        break;

      case "text": {
        const text = token as Tokens.Text;
        pushParagraph(
          ctx,
          text.tokens ? inlineFrom(text.tokens) : [{ kind: "text", text: text.text }],
        );
        break;
      }

      case "list": {
        const list = token as Tokens.List;
        if (list.ordered) {
          let n = Number(list.start || 1);
          for (const item of list.items) {
            const marker = /^\s*(\d{1,4})[.)]/.exec(item.raw ?? "");
            const number = marker ? marker[1] : String(n);
            pushListItemAsParagraphs(ctx, item, number);
            n = Number(number) + 1;
          }
        } else {
          const items = list.items.map((item) => inlineFrom(flattenItemTokens(item)));
          if (items.length > 0) ctx.blocks.push({ kind: "list", ordered: false, items });
        }
        break;
      }

      case "blockquote": {
        const quote = token as Tokens.Blockquote;
        const inner: ParseContext = { ...ctx, blocks: [] };
        walk(inner, quote.tokens);
        if (inner.blocks.length > 0) ctx.blocks.push({ kind: "quote", blocks: inner.blocks });
        break;
      }

      case "code":
        pushParagraph(ctx, [{ kind: "text", text: (token as Tokens.Code).text }]);
        break;

      case "hr":
        ctx.blocks.push({ kind: "rule" });
        break;

      case "html": {
        const text = (token as Tokens.HTML).text.replace(/<[^>]*>/g, "").trim();
        if (text) pushParagraph(ctx, [{ kind: "text", text }]);
        break;
      }

      case "space":
      default:
        break;
    }
  }
}

export function parseJudgmentMarkdown(fullText: string, title?: string): ParsedJudgment {
  const source = (fullText ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) return { blocks: [], outline: [], paragraphCount: 0 };

  const ctx: ParseContext = {
    blocks: [],
    outline: [],
    usedIds: new Set(),
    paragraphNumbers: new Set(),
    title,
  };

  walk(ctx, marked.lexer(source, { gfm: true, breaks: false }));

  return { blocks: ctx.blocks, outline: ctx.outline, paragraphCount: ctx.paragraphNumbers.size };
}

export function pinpointReference(citation: string | undefined, paragraph: string): string {
  return citation ? `${citation} at para ${paragraph}` : `Para ${paragraph}`;
}
