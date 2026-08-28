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
  | { kind: "paragraph"; number: string | null; children: InlineNode[] }
  | { kind: "quote"; blocks: JudgmentBlock[] }
  | { kind: "list"; ordered: false; items: InlineNode[][] }
  | { kind: "rule" }
  | { kind: "frontmatter"; lines: string[] };

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
    // The judgment header (above the reading panel) already shows the LexTech Report citation, so
    // the source document's own "Coram: ..." line is dropped rather than rendered here.
    return;
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

// Matches the FIRST line of a paragraph belonging to the canonical Nigerian-court-judgment header
// block synthesised by the Gemini formatting pass (see gemini-judgment-formatter.service.ts rule
// 8) — "IN THE ... COURT", "BEFORE THEIR LORDSHIPS:", "APPEAL NO.:"/"SUIT NO.:", "BETWEEN:", "AND".
const FRONT_MATTER_LINE_RE =
  /^(?:IN THE\b|BEFORE THEIR LORDSHIPS\b|(?:APPEAL|SUIT) NO\.?:|BETWEEN:?$|AND$)/i;
// A party line ending in its designation, e.g. "SHOOTING STARS SPORTS CLUB LTD (3SC) — APPELLANT".
const FRONT_MATTER_PARTY_RE =
  /—\s*(APPELLANT|RESPONDENT|APPLICANT|DEFENDANT|CLAIMANT|PETITIONER|CROSS-APPELLANT|CROSS-RESPONDENT)S?\.?\s*$/i;
// The old JELR-style citation summary line some legacy imports carry directly under the title,
// e.g. "(2024) JELR 114312 (CA) COURT OF APPEAL · CA/IB/03/2016 · MARCH 14, 2024 · NIGERIA".
const CITATION_SUMMARY_RE =
  /\((?:19|20)\d{2}\)[^\n]*?\b(COURT OF APPEAL|SUPREME COURT|HIGH COURT|FEDERAL HIGH COURT)\b/i;
const OTHER_CITATIONS_HEADING_RE = /^##\s+OTHER CITATIONS\s*$/im;
const LEADING_H1_RE = /^#\s+(?!#)/;
const HEADING_OR_CORAM_RE = /^(?:#{1,6}\s|\*\*Coram:)/i;

// ---------------------------------------------------------------------------
// Legacy JELR metadata block
//
// Imports scraped from JELR carry, directly under the synthesised court header, the source site's
// own masthead: the case title repeated ("BASKET FOODS LTD / V. / FCMB"), a "Full Title" label with
// the court/suit/date summary line under it, sometimes an "OTHER CITATIONS" list, and a "CORAM"
// label with the panel repeated. Every one of those facts is already shown in the header above the
// reading panel and in the synthesised "BEFORE THEIR LORDSHIPS:" block, so the whole run is dropped
// before parsing. The block appears in a dozen shapes — plain, "**bold**", "### heading", bulleted,
// each part its own paragraph or all of it collapsed onto one line — so it is matched line by line
// on the *undecorated* text rather than as a fixed paragraph sequence.
// ---------------------------------------------------------------------------

/** Strips Markdown decoration (heading hashes, list bullets, emphasis, quote markers) so a line can
 * be matched on its words alone, whatever wrapping the import happened to use. */
function undecorate(line: string): string {
  return line
    .replace(/^\s*[>#]+\s*/, "")
    .replace(/^\s*[*\-•]\s+/, "")
    .replace(/[*_]/g, "")
    .trim();
}

function uppercaseRatio(text: string): number {
  const letters = text.match(/[A-Za-z]/g);
  if (!letters || letters.length < 3) return 0;
  const upper = text.match(/[A-Z]/g) ?? [];
  return upper.length / letters.length;
}

const JELR_FULL_TITLE_RE = /\bFULL TITLE\b/i;
const JELR_CORAM_RE = /^CORAM\b\s*:?\s*/i;
// What may follow the "Full Title" label on the same line: nothing, or the court/suit/date summary.
const JELR_SUMMARY_TAIL_RE = /^[\s:·•|-]*(?:[A-Z][A-Z.,'()&/\s-]*)?\b(?:COURT|TRIBUNAL|COMMISSION)\b/i;
const JELR_LABEL_RE = /^(FULL TITLE|CORAM|OTHER CITATIONS)\b\s*:?\s*/i;
const JELR_SEPARATOR_RE = /^[·•|:.\s-]*$/;
// "COURT OF APPEAL · CA/L/508/2011(R) · 17 JUL 2020 · NIGERIA" — dot-separated court/suit/date.
const JELR_SUMMARY_RE = /[·•][^\n]*\b(?:COURT|TRIBUNAL|COMMISSION)\b|\b(?:COURT|TRIBUNAL|COMMISSION)\b[^\n]*[·•]/i;
// A reported citation on its own line, e.g. "(2013) 16 NWLR (PT. 1380) 249".
const JELR_CITATION_RE = /^\(?(?:19|20)\d{2}\)?[\s)]/;
// How an opinion announces itself — "(Delivering the Leading Judgment)". A coram's own
// "(DELIVERED BY JAMES SHEHU ABIRIYI, JCA)" note is deliberately not matched: it is masthead.
const DELIVERING_RE = /\(\s*deliver\w*\s+the\b/i;
// The judge's name and that announcement together, used to cut a masthead line short when the
// first opinion has been run onto the end of it.
const OPINION_OPENER_RE = /[A-Z][A-Z.\s,'-]{2,60}\(\s*deliver\w*\s+the\b/i;
// Judicial post-nominals, used to recognise a title-case panel list.
const JUDGE_TITLE_RE =
  /\b(?:J\.?C\.?A\.?|J\.?S\.?C\.?|C\.?J\.?N\.?|P\.?C\.?A\.?|J\.?A\.?|JUSTICE|JUDGE)\b|,\s*J{1,2}\.?\s*$/i;
const PARTY_SEPARATOR_RE = /^(?:V|VS|V\.|VS\.|AND|&)$/i;
// All-caps lines that open the judgment proper rather than belonging to the masthead — the block
// walk must never cross one of these, in either direction.
const BODY_MARKER_RE =
  /^(?:JUDGMENT|JUDGEMENT|RULING|ORDER|DECISION|RATIO DECIDENDI|COUNSEL|APPEARANCES|LEGAL REPRESENTATION|BRIEF FACTS|FACTS|INTRODUCTION|ISSUES?\b)/i;
// How far into the document the masthead may start, and how many lines it may run for. Both are
// generous for the shapes seen in the archive while keeping the scan away from the judgment body.
const JELR_SCAN_LINES = 80;
const JELR_BLOCK_MAX_LINES = 40;

function isHeadingLine(line: string): boolean {
  return /^\s*#{1,6}\s/.test(line);
}

/** True for the repeated-title lines above the masthead label — all-caps party names, the "V."
 * between them, and the court/suit/date summary line when the label sits below it. */
function isJelrTitleLine(text: string): boolean {
  if (PARTY_SEPARATOR_RE.test(text)) return true;
  if (text.length > 200 || DELIVERING_RE.test(text) || BODY_MARKER_RE.test(text)) return false;
  if (FRONT_MATTER_LINE_RE.test(text) || FRONT_MATTER_PARTY_RE.test(text)) return false;
  return uppercaseRatio(text) >= 0.9;
}

/** Where an opinion that has been run onto the end of a masthead line begins — its judge's name,
 * which is what follows the last court or panel word ahead of the "(Delivering ..)" announcement.
 * Returns -1 when the line carries no opinion. */
function opinionStart(text: string): number {
  const opener = OPINION_OPENER_RE.exec(text);
  if (!opener) return -1;
  const before = text.slice(0, text.indexOf("(", opener.index));
  const panel = /.*\b(?:NIGERIA|COURT|APPEAL|CORAM|JUSTICE)\b[\s,.:;-]*/i.exec(before);
  if (panel) return panel[0].length;
  // No court or panel word to cut after — the names are separated by commas instead, so the last
  // one before the announcement is the judge delivering it.
  const separator = Math.max(before.lastIndexOf(","), before.lastIndexOf(";"));
  return separator >= 0 ? separator + 1 : opener.index;
}

/** True when the text ahead of the masthead label on its line is the repeated title, allowing for
 * a scrape artifact in front of it — "Case Citing cases 1 OBIANWUNA V. NEPA Full Title ..." — which
 * belongs to the masthead and goes with it. */
function endsWithTitle(head: string): boolean {
  const words = head.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i += 1) {
    if (isJelrTitleLine(words.slice(i).join(" "))) return true;
  }
  return false;
}

/** True for a panel line — the all-caps run of judges listed under "CORAM", with or without their
 * "JUSTICE OF THE COURT OF APPEAL OF NIGERIA" titles. */
function isPanelLine(text: string): boolean {
  if (text.length > 400 || DELIVERING_RE.test(text) || BODY_MARKER_RE.test(text)) return false;
  return uppercaseRatio(text) >= 0.9;
}

/** True for the panel listed on the "Coram:" line itself, which newer imports write in title case
 * — "Coram: Raphael Chikwe Agbo JCA, Balkisu Bello Aliyu JCA", "Coram: Joan Eyi King, J", or bare
 * names — so it is recognised by the judges' post-nominals or by every word being a proper name.
 * That keeps it clear of a coram mentioned in a sentence of the body, whose ordinary lowercase
 * words ("... Coram Ayo-Emmanuel J. transferring a criminal charge ...") disqualify it. */
function isNamedPanel(text: string): boolean {
  if (text.length > 400 || DELIVERING_RE.test(text)) return false;
  if (isPanelLine(text) || JUDGE_TITLE_RE.test(text)) return true;
  const words = text.split(/[\s,;]+/).filter(Boolean);
  return words.length > 0 && words.every((word) => /^[^a-z]/.test(word));
}

/** Walks forward from the masthead label over the rest of the block: its other labels — alone on
 * their line or leading the value, "**OTHER CITATIONS:** (2017) 2 NWLR (PT. 1548) 99" — the
 * court/suit/date summary, whether on one line or broken across several, reported citations, and
 * the panel under "CORAM". Panel names are only accepted once a "CORAM" label has been seen, so an
 * all-caps line further down the judgment is never mistaken for one. Returns the index to cut to,
 * exclusive, along with any opinion opener found run onto the end of a line of the block. */
function jelrBlockEnd(
  lines: string[],
  marker: number,
  coramSeen: boolean,
): { end: number; carry: string } {
  let end = marker + 1;
  let inCoram = coramSeen;

  for (let i = marker + 1; i < lines.length && i - marker <= JELR_BLOCK_MAX_LINES; i += 1) {
    const text = undecorate(lines[i]);
    if (!text) continue;

    const label = JELR_LABEL_RE.exec(text);
    if (label) {
      const value = text.slice(label[0].length).trim();
      const opinion = opinionStart(value);
      const names = opinion < 0 ? value : value.slice(0, opinion).trim();
      if (!names || isNamedPanel(names) || JELR_CITATION_RE.test(names) || JELR_SUMMARY_RE.test(names)) {
        inCoram = inCoram || /^CORAM/i.test(label[1]);
        end = i + 1;
        if (opinion >= 0) return { end, carry: value.slice(opinion).trim() };
        continue;
      }
    }
    if (isHeadingLine(lines[i])) break;

    if (JELR_SEPARATOR_RE.test(text) || JELR_CITATION_RE.test(text) || JELR_SUMMARY_RE.test(text)) {
      end = i + 1;
      continue;
    }
    // The summary is sometimes broken one field to a line — "COURT OF APPEAL" / "CA/K/95/2009" /
    // "22 MAY 2015" / "NIGERIA" — which reads as a run of short all-caps fragments.
    if (!inCoram && text.length <= 60 && isPanelLine(text)) {
      end = i + 1;
      continue;
    }
    if (inCoram && isPanelLine(text)) {
      end = i + 1;
      continue;
    }
    break;
  }

  return { end, carry: "" };
}

/** Walks back from the masthead label over the repeated title above it. Returns the index to cut
 * from. */
function jelrBlockStart(lines: string[], marker: number): number {
  let start = marker;
  for (let i = marker - 1; i >= 0; i -= 1) {
    const text = undecorate(lines[i]);
    if (!text) continue;
    if (isHeadingLine(lines[i]) || !isJelrTitleLine(text)) break;
    start = i;
  }
  return start;
}

/** Removes the legacy JELR masthead — repeated title, "Full Title" summary, "OTHER CITATIONS" list
 * and "CORAM" panel — from the head of the judgment. Judgments without one are returned untouched.
 * A "Coram" mentioned inside a sentence of the body (".. delivered .. Coram Ayo-Emmanuel J. ..") is
 * prose rather than a label line, so it is never matched. */
function stripJelrMasthead(source: string): string {
  const lines = source.split("\n");

  let marker = -1;
  let markerTail = "";
  let coramMarker = false;

  for (let i = 0; i < Math.min(lines.length, JELR_SCAN_LINES); i += 1) {
    const text = undecorate(lines[i]);
    if (!text) continue;

    const label = JELR_FULL_TITLE_RE.exec(text);
    if (label) {
      const head = text.slice(0, label.index).trim();
      const tail = text.slice(label.index + label[0].length);
      // Guard against the phrase turning up in prose: the label ends its line or leads straight
      // into the court summary, and anything ahead of it on the line is the repeated title.
      const tailOk = JELR_SEPARATOR_RE.test(tail) || JELR_SUMMARY_TAIL_RE.test(tail);
      if (tailOk && (!head || endsWithTitle(head))) {
        marker = i;
        markerTail = tail;
        break;
      }
    }

    // The same masthead sometimes arrives without a "Full Title" label, opening at "CORAM" — and
    // occasionally with the first opinion's opener run onto the end of that very line.
    const coram = JELR_CORAM_RE.exec(text);
    if (coram) {
      const panel = text.slice(coram[0].length).trim();
      const opinion = opinionStart(panel);
      const names = opinion < 0 ? panel : panel.slice(0, opinion).trim();
      if (!names || isNamedPanel(names)) {
        marker = i;
        markerTail = opinion < 0 ? "" : panel;
        coramMarker = true;
        break;
      }
    }
  }
  if (marker < 0) return source;

  const { end, carry } = jelrBlockEnd(lines, marker, coramMarker);
  const start = jelrBlockStart(lines, marker);

  // A merged line — "OKON V. OKON  Full Title COURT OF APPEAL · .. CORAM .." — is masthead all the
  // way to its end in every shape seen. Where an opinion has been run onto the end of one of the
  // block's lines, the cut stops at its opener and the opener is kept — unless the judgment repeats
  // it on the line below, as several imports do, in which case the whole line goes.
  const opinion = opinionStart(markerTail);
  const opener = opinion < 0 ? carry : markerTail.slice(opinion).trimStart();
  const next = lines.slice(end).map(undecorate).find(Boolean) ?? "";
  const repeated = Boolean(opener) && next.slice(0, 24).toLowerCase() === opener.slice(0, 24).toLowerCase();

  const rest = opener && !repeated ? [opener, ...lines.slice(end)] : lines.slice(end);
  return [...lines.slice(0, start), ...rest].join("\n");
}

/** Splits raw source text into blank-line-separated paragraphs, the same unit `marked` treats as
 * a paragraph, but keeping each paragraph's internal line breaks intact — needed because the next
 * step must render "BEFORE THEIR LORDSHIPS: judge one / judge two / judge three" as three lines,
 * which `marked`'s soft-line-break-to-space collapsing would otherwise erase. */
function splitParagraphs(source: string): string[] {
  return source.split(/\n{2,}/);
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Drops every "## OTHER CITATIONS" section — heading plus the citation lines under it, up to
 * the next heading — wherever it appears in the source, not just inside the canonical leading
 * header block. That content duplicates the citation already shown in the page header above the
 * reading panel. */
function stripOtherCitationsSections(source: string): string {
  const paras = splitParagraphs(source);
  const out: string[] = [];
  let i = 0;
  while (i < paras.length) {
    if (OTHER_CITATIONS_HEADING_RE.test(paras[i])) {
      i += 1;
      while (i < paras.length && !/^#{1,6}\s/.test(paras[i].trim())) i += 1;
      continue;
    }
    out.push(paras[i]);
    i += 1;
  }
  return out.join("\n\n");
}

/** Frontmatter `lines` are rendered as plain text (never run through the Markdown inline parser),
 * so any "**bold**"/"*em*" wrapping carried over from a synthesised header line — e.g. the
 * citation-summary line, which formatting passes emit in bold — would otherwise show up as
 * literal asterisks on screen. */
function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1");
}

/** Some imports fused the JELR masthead's "Full Title" label onto the last party line of the
 * synthesised header — "Ototo Full Title — RESPONDENT". The label is not part of the party's name,
 * so it is dropped from the line rather than shown. */
function stripStrayFullTitle(text: string): string {
  return FRONT_MATTER_PARTY_RE.test(text) ? text.replace(/\s*\bFULL TITLE\b/i, "") : text;
}

/** Pulls the leading run of canonical-header paragraphs (see FRONT_MATTER_LINE_RE /
 * FRONT_MATTER_PARTY_RE) off the front of `source`, splitting each onto its own display line —
 * one per judge, one for "APPEAL NO.:", one for "SUIT NO.:", etc. — rather than the single
 * run-on line `marked` would otherwise produce. Immediately after that run, also absorbs (and
 * replaces with `citation`) an old JELR-style citation-summary line, dropping any "OTHER
 * CITATIONS" section that follows it — that content duplicated the citation already shown in the
 * page header above the reading panel and in the synthesised header itself. Returns null when the
 * text doesn't open with this header at all, leaving `source` untouched for ordinary judgments. */
function extractCanonicalHeader(
  source: string,
  citation?: string,
): { lines: string[]; rest: string } | null {
  const paras = splitParagraphs(source);

  let end = 0;
  while (end < paras.length) {
    const para = paras[end].trim();
    const firstLine = para.split("\n")[0].trim();
    if (!FRONT_MATTER_LINE_RE.test(firstLine) && !FRONT_MATTER_PARTY_RE.test(collapseWhitespace(para))) break;
    end += 1;
  }
  if (end === 0) return null;

  const lines: string[] = [];
  for (const para of paras.slice(0, end)) {
    for (const line of para.split("\n")) {
      const trimmed = stripStrayFullTitle(stripMarkdownEmphasis(line.trim()));
      if (trimmed) lines.push(trimmed);
    }
  }

  let rest = paras.slice(end);
  // A duplicate "# Title" heading, if present, is left in place (kept at rest[0]) for the existing
  // heading-suppression logic in pushHeading to drop. Some formatting passes instead emit the
  // title as several standalone "**Bold**" paragraphs ahead of the citation line (e.g.
  // "**MUHAMMAD ABUBAKAR KABIR**" / "**V.**" / "**...RESPONDENTS**") — those have no heading token
  // for pushHeading to catch, so they're identified here and dropped outright below.
  const BOLD_ONLY_PARA_RE = /^\*\*[^*\n]+\*\*$/;
  let keepPrefix = 0; // leading paragraphs of `rest` left untouched
  let boldTitleRun = 0; // standalone bold title paragraphs to drop, once confirmed by what follows
  if (rest[0] && LEADING_H1_RE.test(rest[0])) {
    keepPrefix = 1;
  } else {
    let idx = 0;
    while (rest[idx] && BOLD_ONLY_PARA_RE.test(rest[idx].trim())) idx += 1;
    if (idx > 0 && rest[idx] && CITATION_SUMMARY_RE.test(collapseWhitespace(rest[idx]))) {
      boldTitleRun = idx;
    }
  }
  const citationIdx = keepPrefix + boldTitleRun;
  const citationPara = rest[citationIdx];
  if (citationPara && CITATION_SUMMARY_RE.test(collapseWhitespace(citationPara))) {
    if (citation) {
      const collapsed = collapseWhitespace(citationPara).replace(/\s*[·|]?\s*$/, "");
      const replaced = collapsed.replace(
        /^\(?(?:19|20)\d{2}\)?.*?(?=(?:COURT OF APPEAL|SUPREME COURT|HIGH COURT|FEDERAL HIGH COURT))/i,
        `${citation} · `,
      );
      lines.push(stripMarkdownEmphasis(replaced));
    }

    let dropEnd = citationIdx + 1;
    if (rest[dropEnd] && OTHER_CITATIONS_HEADING_RE.test(rest[dropEnd])) {
      dropEnd += 1;
      while (rest[dropEnd] && !HEADING_OR_CORAM_RE.test(rest[dropEnd])) dropEnd += 1;
    }
    rest = [...rest.slice(0, keepPrefix), ...rest.slice(dropEnd)];
  }

  // A "**Coram:** judge one, judge two, ..." or "**CORAM**\n**Judge One**\n**Judge Two**..."
  // paragraph directly under the header duplicates the judges already listed individually under
  // "BEFORE THEIR LORDSHIPS:" above — drop it. (A later mid-document mention of a lower court's
  // coram, e.g. "...Coram: Bolaji, J....", is plain prose inside a sentence, not its own bolded
  // paragraph, so it's untouched.)
  if (rest[keepPrefix] && /^\*\*coram:?\*\*?/i.test(rest[keepPrefix])) {
    rest = [...rest.slice(0, keepPrefix), ...rest.slice(keepPrefix + 1)];
  }

  return { lines, rest: rest.join("\n\n") };
}

export function parseJudgmentMarkdown(fullText: string, title?: string, citation?: string): ParsedJudgment {
  const rawSource = (fullText ?? "").replace(/\r\n/g, "\n").trim();
  if (!rawSource) return { blocks: [], outline: [], paragraphCount: 0 };

  const source = stripJelrMasthead(stripOtherCitationsSections(rawSource));
  const header = extractCanonicalHeader(source, citation);

  const ctx: ParseContext = {
    blocks: [],
    outline: [],
    usedIds: new Set(),
    paragraphNumbers: new Set(),
    title,
  };

  walk(ctx, marked.lexer(header ? header.rest : source, { gfm: true, breaks: false }));

  const blocks = header ? [{ kind: "frontmatter" as const, lines: header.lines }, ...ctx.blocks] : ctx.blocks;

  return { blocks, outline: ctx.outline, paragraphCount: ctx.paragraphNumbers.size };
}

export function pinpointReference(citation: string | undefined, paragraph: string): string {
  return citation ? `${citation} at para ${paragraph}` : `Para ${paragraph}`;
}
