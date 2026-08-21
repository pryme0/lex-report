"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  Minus,
  Plus,
  Quote,
} from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import type { SourcePage } from "@/lib/api/types";
import { copyText } from "@/lib/judgment";
import {
  parseJudgmentMarkdown,
  pinpointReference,
  type InlineNode,
  type JudgmentBlock,
  type OutlineEntry,
} from "@/lib/judgment-markdown";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  lead: "Lead judgment",
  concurring: "Concurring",
  dissenting: "Dissenting",
};

const TEXT_SIZES = ["sm", "md", "lg", "xl"] as const;
type TextSize = (typeof TEXT_SIZES)[number];
const TEXT_SIZE_KEY = "lexreport:judgment-text-size";

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.kind) {
          case "text":
            return <Fragment key={i}>{node.text}</Fragment>;
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
          case "del":
            return (
              <del key={i}>
                <Inline nodes={node.children} />
              </del>
            );
          case "code":
            return (
              <code key={i} className="judgment-code">
                {node.text}
              </code>
            );
          case "link":
            return (
              <a
                key={i}
                className="judgment-inline-link"
                href={node.href}
                rel="noreferrer noopener"
                target={node.href.startsWith("http") ? "_blank" : undefined}
              >
                <Inline nodes={node.children} />
              </a>
            );
          case "break":
            return <br key={i} />;
        }
      })}
    </>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
    );

    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function useReadingProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = ref.current;
    if (!article) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(rect.bottom <= window.innerHeight ? 1 : 0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, -rect.top / scrollable)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return progress;
}

function useTextSize(): [TextSize, (next: TextSize) => void] {
  const [size, setSize] = useState<TextSize>("md");

  useEffect(() => {
    const stored = window.localStorage.getItem(TEXT_SIZE_KEY);
    if (stored && (TEXT_SIZES as readonly string[]).includes(stored)) setSize(stored as TextSize);
  }, []);

  const update = (next: TextSize) => {
    setSize(next);
    try {
      window.localStorage.setItem(TEXT_SIZE_KEY, next);
    } catch {
      void 0;
    }
  };

  return [size, update];
}

function JudgmentOutline({ entries, activeId }: { entries: OutlineEntry[]; activeId: string | null }) {
  return (
    <nav className="judgment-outline judgment-no-print" aria-label="Contents of this judgment">
      <div className="judgment-outline-label">In this judgment</div>
      <ol className="judgment-outline-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "judgment-outline-link",
                `is-${entry.type}`,
                activeId === entry.id && "is-active",
              )}
              aria-current={activeId === entry.id ? "true" : undefined}
            >
              {entry.type === "opinion" && (
                <span className={cn("judgment-badge", `is-${entry.role}`)}>
                  {ROLE_LABEL[entry.role ?? "concurring"]}
                </span>
              )}
              <span className="judgment-outline-name">{entry.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TextSizeControl({ size, onChange }: { size: TextSize; onChange: (next: TextSize) => void }) {
  const index = TEXT_SIZES.indexOf(size);

  return (
    <div className="judgment-size-control judgment-no-print" role="group" aria-label="Text size">
      <button
        type="button"
        className="judgment-size-btn"
        onClick={() => onChange(TEXT_SIZES[Math.max(0, index - 1)])}
        disabled={index === 0}
        aria-label="Decrease text size"
      >
        <Minus size={12} aria-hidden="true" />
      </button>
      <span className="judgment-size-value" aria-live="polite">
        Aa
      </span>
      <button
        type="button"
        className="judgment-size-btn"
        onClick={() => onChange(TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, index + 1)])}
        disabled={index === TEXT_SIZES.length - 1}
        aria-label="Increase text size"
      >
        <Plus size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

function Blocks({
  blocks,
  onCopyPinpoint,
}: {
  blocks: JudgmentBlock[];
  onCopyPinpoint?: (paragraph: string) => void;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        switch (block.kind) {
          case "heading": {
            const Tag = (["h2", "h2", "h3", "h4"] as const)[block.level - 1];
            return (
              <Tag
                key={key}
                id={block.id}
                className={cn("judgment-heading", `judgment-heading--h${block.level}`)}
              >
                {block.text}
              </Tag>
            );
          }

          case "opinion":
            return (
              <div key={key} id={block.id} className={cn("judgment-opinion", `is-${block.role}`)}>
                <span className={cn("judgment-badge", `is-${block.role}`)}>
                  {ROLE_LABEL[block.role]}
                </span>
                <h3 className="judgment-opinion-judge">{block.judge}</h3>
                {block.qualifier && <p className="judgment-opinion-note">{block.qualifier}</p>}
              </div>
            );

          case "paragraph":
            return (
              <p
                key={key}
                id={block.number ? `para-${block.number}` : undefined}
                className={cn("judgment-para", block.number && "judgment-para--numbered")}
              >
                {block.number &&
                  (onCopyPinpoint ? (
                    <button
                      type="button"
                      className="judgment-para-num judgment-no-print"
                      onClick={() => onCopyPinpoint(block.number!)}
                      aria-label={`Copy pinpoint citation for paragraph ${block.number}`}
                      title={`Copy pinpoint citation for paragraph ${block.number}`}
                    >
                      {block.number}.
                      <LinkIcon size={10} className="judgment-para-num-icon" aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="judgment-para-num" aria-hidden="true">
                      {block.number}.
                    </span>
                  ))}
                {block.number && onCopyPinpoint && (
                  <span className="judgment-para-num judgment-print-only" aria-hidden="true">
                    {block.number}.
                  </span>
                )}
                <Inline nodes={block.children} />
              </p>
            );

          case "quote":
            return (
              <blockquote key={key} className="judgment-quote">
                <Quote size={14} className="judgment-quote-mark judgment-no-print" aria-hidden="true" />
                <Blocks blocks={block.blocks} />
              </blockquote>
            );

          case "list":
            return (
              <ul key={key} className="judgment-list">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline nodes={item} />
                  </li>
                ))}
              </ul>
            );

          case "rule":
            return <hr key={key} className="judgment-rule" />;

          case "frontmatter":
            return (
              <div key={key} className="judgment-page-front-matter">
                {block.lines.map((line, i) => (
                  <span key={i} className="judgment-page-front-line">
                    {line}
                  </span>
                ))}
              </div>
            );
        }
      })}
    </>
  );
}

type PageSegment =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string; numbered: boolean };

const DECISION_MARKER_RE = /^(?:JUDGMENT|JUDGEMENT|RULING|ORDER|DECISION)$/i;

function isPageHeading(line: string): boolean {
  const letters = line.match(/[A-Za-z]/g) ?? [];
  const uppercase = line.match(/[A-Z]/g) ?? [];
  return (
    line.length <= 100 &&
    letters.length >= 3 &&
    uppercase.length / letters.length > 0.88 &&
    /^(?:ISSUE\b|LEGAL REPRESENTATION|APPELLANT|RESPONDENT|APPLICANT|COURT|CONCLUSION|RESOLUTION|SUBMISSIONS|PRELIMINARY|INTRODUCTION|ORDERS?|APPEAL NO|SUIT NO)/i.test(
      line,
    )
  );
}

function joinWrappedLines(lines: string[]): string {
  return lines.reduce((text, line) => {
    if (!text) return line;
    return /[A-Za-z]-$/.test(text) && /^[a-z]/.test(line)
      ? `${text.slice(0, -1)}${line}`
      : `${text} ${line}`;
  }, "");
}

function segmentPageText(text: string): PageSegment[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());
  const segments: PageSegment[] = [];
  let buffer: string[] = [];
  let numbered = false;

  const flush = () => {
    const value = joinWrappedLines(buffer).trim();
    if (value) segments.push({ kind: "paragraph", text: value, numbered });
    buffer = [];
    numbered = false;
  };

  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }
    if (isPageHeading(line)) {
      flush();
      segments.push({ kind: "heading", text: line });
      continue;
    }
    if (/^(?:\d{1,2}[.)]|[ivxlcdm]+[.)])\s+/i.test(line)) {
      flush();
      numbered = true;
      buffer.push(line);
      continue;
    }

    const accumulated = joinWrappedLines(buffer);
    if (buffer.length && accumulated.length > 360 && /[.!?][”"')\]]?$/.test(accumulated)) {
      flush();
    }
    buffer.push(line);
  }
  flush();
  return segments;
}

function PageBody({
  page,
  frontMatter,
  onCopy,
  anchorId,
  showCoatOfArms,
  caseCitation,
}: {
  page: SourcePage;
  frontMatter: "all" | "through-marker" | "none";
  onCopy?: (citation: string) => void;
  anchorId?: string;
  showCoatOfArms?: boolean;
  caseCitation?: string;
}) {
  const editorialBlocks = useMemo(
    () =>
      page.extraction === "editorial"
        ? parseJudgmentMarkdown(page.text, undefined, caseCitation).blocks
        : [],
    [page.extraction, page.text, caseCitation],
  );
  const lines = page.text.replace(/\r\n/g, "\n").split("\n");
  const markerIndex = lines.findIndex((line) => DECISION_MARKER_RE.test(line.trim()));
  const frontEnd =
    frontMatter === "all" ? lines.length : frontMatter === "through-marker" ? markerIndex + 1 : 0;
  const frontLines = lines.slice(0, Math.max(0, frontEnd));
  const body = lines.slice(Math.max(0, frontEnd)).join("\n");

  return (
    <section
      id={anchorId}
      className={cn("judgment-source-page", page.extraction === "editorial" && "is-editorial")}
    >
      <header className="judgment-page-running-head">
        <span>Electronic Lex Report</span>
        <button
          type="button"
          className="judgment-page-cite judgment-no-print"
          onClick={() => onCopy?.(page.citation)}
          title="Copy page citation"
        >
          {page.citation}
          <Copy size={11} aria-hidden="true" />
        </button>
        <span className="judgment-page-cite judgment-print-only">{page.citation}</span>
      </header>

      <div className="judgment-page-content">
        {page.extraction === "editorial" ? (
          <div className="judgment-page-markdown">
            <Blocks blocks={editorialBlocks} />
          </div>
        ) : frontLines.length > 0 ? (
          <div className="judgment-page-front-matter">
            {showCoatOfArms && (
              <img
                className="judgment-coat-of-arms"
                src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Coat_of_arms_of_Nigeria.svg"
                alt="Coat of arms of Nigeria"
                width="112"
                height="95"
              />
            )}
            {frontLines.map((line, index) => {
              const value = line.trim();
              if (!value) return <span key={index} className="judgment-page-front-space" />;
              return (
                <span
                  key={index}
                  className={cn(
                    "judgment-page-front-line",
                    DECISION_MARKER_RE.test(value) && "is-decision-label",
                  )}
                >
                  {value}
                </span>
              );
            })}
          </div>
        ) : null}

        {page.extraction !== "editorial" &&
          segmentPageText(body).map((segment, index) =>
            segment.kind === "heading" ? (
              <h3 key={index} className="judgment-page-heading">
                {segment.text}
              </h3>
            ) : (
              <p
                key={index}
                className={cn("judgment-page-paragraph", segment.numbered && "is-numbered")}
              >
                {segment.text}
              </p>
            ),
          )}
      </div>

      <footer className="judgment-page-footer">
        <span>{page.number}</span>
      </footer>
    </section>
  );
}

function PaginatedJudgment({
  pages,
  print,
  textSize,
  onTextSizeChange,
  citation,
}: {
  pages: SourcePage[];
  print: boolean;
  textSize: TextSize;
  onTextSizeChange?: (next: TextSize) => void;
  citation?: string;
}) {
  const { showToast } = useDashboard();
  const articleRef = useRef<HTMLElement>(null);
  const orderedPages = useMemo(() => [...pages].sort((a, b) => a.number - b.number), [pages]);
  const [activePage, setActivePage] = useState(orderedPages[0]?.number ?? 1);
  const markerPageIndex = orderedPages.findIndex((page) =>
    page.text.split(/\r?\n/).some((line) => DECISION_MARKER_RE.test(line.trim())),
  );
  const progress = useReadingProgress(print ? { current: null } : articleRef);

  useEffect(() => {
    if (print || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActivePage(Number(visible.target.getAttribute("data-page-number")));
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    const nodes = orderedPages
      .map((page) => document.querySelector(`[data-page-number="${page.number}"]`))
      .filter((node): node is Element => Boolean(node));
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [orderedPages, print]);

  useEffect(() => {
    if (print || typeof window === "undefined") return;
    const match = /^#source-page-(\d+)$/.exec(window.location.hash);
    if (!match) return;

    const pageNumber = Number(match[1]);
    if (!orderedPages.some((page) => page.number === pageNumber)) return;
    setActivePage(pageNumber);

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`source-page-${pageNumber}`)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [orderedPages, print]);

  const goToPage = (number: number) => {
    window.history.replaceState(null, "", `#source-page-${number}`);
    setActivePage(number);
    document.getElementById(`source-page-${number}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const copyPageCitation = async (pageCitation: string) => {
    const ok = await copyText(pageCitation);
    showToast(ok ? `Copied "${pageCitation}".` : "Could not copy citation.");
  };

  return (
    <div className={cn("judgment-pages-layout", print && "is-print")}>
      {!print && (
        <aside className="judgment-page-index judgment-no-print" aria-label="Judgment pages">
          <div className="judgment-outline-label">Pages</div>
          <div className="judgment-page-index-list">
            {orderedPages.map((page) => (
              <button
                key={page.number}
                type="button"
                className={cn("judgment-page-index-link", activePage === page.number && "is-active")}
                onClick={() => goToPage(page.number)}
                aria-current={activePage === page.number ? "page" : undefined}
              >
                <span>Page {page.number}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="judgment-pages-column">
        {!print && (
          <div className="judgment-reading-bar judgment-page-toolbar judgment-no-print">
            <div className="judgment-reading-meta">
              <strong>Page {activePage} of {orderedPages.length}</strong>
              <span className="judgment-reading-progress" aria-hidden="true">
                <span
                  className="judgment-reading-progress-fill"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
            </div>
            <div className="judgment-page-tools">
              <div className="judgment-page-stepper" role="group" aria-label="Page navigation">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(orderedPages[0].number, activePage - 1))}
                  disabled={activePage === orderedPages[0].number}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span>{citation}</span>
                <button
                  type="button"
                  onClick={() =>
                    goToPage(Math.min(orderedPages.at(-1)?.number ?? activePage, activePage + 1))
                  }
                  disabled={activePage === orderedPages.at(-1)?.number}
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              {onTextSizeChange && <TextSizeControl size={textSize} onChange={onTextSizeChange} />}
            </div>
          </div>
        )}

        <article
          ref={articleRef}
          className="judgment-pages"
          data-text-size={textSize}
          aria-label={`Full judgment in ${orderedPages.length} source pages`}
        >
          {orderedPages.map((page, index) => (
            <div key={page.number} data-page-number={page.number} className="judgment-page-anchor">
              <PageBody
                page={page}
                anchorId={print ? undefined : `source-page-${page.number}`}
                showCoatOfArms={index === 0 && page.extraction !== "ocr"}
                frontMatter={
                  markerPageIndex >= 0 && index < markerPageIndex
                    ? "all"
                    : index === markerPageIndex
                      ? "through-marker"
                      : "none"
                }
                onCopy={print ? undefined : copyPageCitation}
                caseCitation={citation}
              />
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}

export function JudgmentText({
  fullText,
  sourcePages,
  citation,
  title,
  court,
  print = false,
}: {
  fullText: string;
  sourcePages?: SourcePage[];
  citation?: string;
  title?: string;
  court?: string;
  print?: boolean;
}) {
  const { showToast } = useDashboard();
  const articleRef = useRef<HTMLElement>(null);
  const [textSize, setTextSize] = useTextSize();

  const { blocks, outline, paragraphCount } = useMemo(
    () => parseJudgmentMarkdown(fullText, title, citation),
    [fullText, title, citation],
  );

  const outlineIds = useMemo(() => outline.map((entry) => entry.id), [outline]);
  const activeId = useActiveSection(print ? [] : outlineIds);
  const progress = useReadingProgress(print ? { current: null } : articleRef);

  if (sourcePages?.length) {
    return (
      <PaginatedJudgment
        pages={sourcePages}
        print={print}
        textSize={print ? "md" : textSize}
        onTextSizeChange={print ? undefined : setTextSize}
        citation={citation ?? court}
      />
    );
  }

  if (print) {
    return (
      <article className="judgment-text" data-text-size="md">
        <Blocks blocks={blocks} />
      </article>
    );
  }

  async function copyPinpoint(paragraph: string) {
    const reference = pinpointReference(citation, paragraph);
    const ok = await copyText(reference);
    showToast(ok ? `Copied "${reference}".` : "Could not copy citation.");
  }

  const showOutline = outline.length > 1;

  return (
    <div className={cn("judgment-text-layout", showOutline && "has-outline")}>
      {showOutline && (
        <div className="judgment-outline-rail judgment-no-print">
          <JudgmentOutline entries={outline} activeId={activeId} />
        </div>
      )}

      <div className="judgment-reading-column">
        <div className="judgment-reading-bar judgment-no-print">
          <div className="judgment-reading-meta">
            {paragraphCount > 0 && <span>{paragraphCount} paragraphs</span>}
            <span className="judgment-reading-progress" aria-hidden="true">
              <span
                className="judgment-reading-progress-fill"
                style={{ transform: `scaleX(${progress})` }}
              />
            </span>
          </div>
          <TextSizeControl size={textSize} onChange={setTextSize} />
        </div>

        <article
          ref={articleRef}
          className="judgment-text"
          data-text-size={textSize}
          aria-label="Full judgment"
        >
          <Blocks blocks={blocks} onCopyPinpoint={copyPinpoint} />
        </article>
      </div>
    </div>
  );
}
