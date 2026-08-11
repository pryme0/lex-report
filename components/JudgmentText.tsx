"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link as LinkIcon, Minus, Plus, Quote } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
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

          case "coram":
            return (
              <p key={key} className="judgment-coram">
                <span className="judgment-coram-label">Coram</span>
                {block.text}
              </p>
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
        }
      })}
    </>
  );
}

export function JudgmentText({
  fullText,
  citation,
  title,
  print = false,
}: {
  fullText: string;
  citation?: string;
  title?: string;
  print?: boolean;
}) {
  const { showToast } = useDashboard();
  const articleRef = useRef<HTMLElement>(null);
  const [textSize, setTextSize] = useTextSize();

  const { blocks, outline, paragraphCount } = useMemo(
    () => parseJudgmentMarkdown(fullText, title),
    [fullText, title],
  );

  const outlineIds = useMemo(() => outline.map((entry) => entry.id), [outline]);
  const activeId = useActiveSection(print ? [] : outlineIds);
  const progress = useReadingProgress(print ? { current: null } : articleRef);

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
