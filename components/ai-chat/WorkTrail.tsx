"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { TimelineItem, AssistantTurnState } from "./types";
import { THINKING_VERBS } from "./types";
import { cn } from "@/lib/utils";

interface WorkTrailProps {
  turn: AssistantTurnState;
  keepOpenAfterComplete?: boolean;
}

const AnimatedEllipsis = () => {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((c) => (c % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return (
    <span aria-hidden="true" className="inline-block w-[1em] text-left">
      {".".repeat(dotCount)}
    </span>
  );
};

const getStepIcon = (item: TimelineItem) => {
  if (item.state === "running") {
    return <CircleDashed className="size-3.5 shrink-0 text-[var(--color-g-600)] animate-pulse" />;
  }
  if (item.state === "error") {
    return <AlertCircle className="size-3.5 shrink-0 text-[var(--color-rose)]" />;
  }
  return <CheckCircle2 className="size-3.5 shrink-0 text-[var(--color-muted)]" />;
};

const formatDuration = (ms?: number): string | null => {
  if (!ms || ms <= 0) return null;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

interface TimelineGroup {
  id: string;
  type: TimelineItem["type"];
  label: string;
  state: TimelineItem["state"];
  items: TimelineItem[];
  summary?: string;
  queries: string[];
  resultCount?: number;
  duration?: number;
}

const groupTimelineItems = (items: TimelineItem[]): TimelineGroup[] => {
  const groups: TimelineGroup[] = [];

  for (const item of items) {
    const queries = item.payload?.queries || (item.payload?.query ? [item.payload.query] : []);
    const canGroup = queries.length === 0 && item.label === groups.at(-1)?.label && !item.payload?.resultCount;
    const previous = canGroup ? groups.at(-1) : null;

    if (previous) {
      previous.items.push(item);
      previous.state =
        item.state === "running" || previous.state === "running"
          ? "running"
          : item.state === "error" || previous.state === "error"
            ? "error"
            : "complete";
      previous.summary = item.summary || previous.summary;
      previous.resultCount = item.payload?.resultCount ?? previous.resultCount;
      previous.duration = item.payload?.duration ?? previous.duration;
      continue;
    }

    groups.push({
      id: item.id,
      type: item.type,
      label: item.label,
      state: item.state,
      items: [item],
      summary: item.summary,
      queries,
      resultCount: item.payload?.resultCount,
      duration: item.payload?.duration,
    });
  }

  return groups;
};

export function WorkTrail({ turn, keepOpenAfterComplete = false }: WorkTrailProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [verbIndex, setVerbIndex] = useState(0);

  // Auto-collapse when complete
  useEffect(() => {
    if (turn.status === "complete" && !keepOpenAfterComplete) {
      setIsOpen(false);
    }
  }, [turn.status, keepOpenAfterComplete]);

  // Rotate thinking verbs while streaming
  useEffect(() => {
    if (turn.status !== "streaming") {
      setVerbIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setVerbIndex((i) => (i + 1) % THINKING_VERBS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [turn.status]);

  const hasTimeline = turn.toolTimeline.length > 0;
  const hasError = Boolean(turn.error?.message);
  const groupedTimeline = groupTimelineItems(turn.toolTimeline);
  const visibleTimeline = groupedTimeline.slice(-8);

  // Count stats
  const toolCount = turn.toolTimeline.filter((t) => t.type === "tool").length;
  const sourceCount = turn.toolTimeline.filter((t) => t.type === "source").length;

  // If nothing to show, render nothing
  if (!hasTimeline && !hasError && turn.status === "complete") {
    return null;
  }

  // Header text
  const headerText = hasError
    ? "Failed"
    : turn.status === "complete"
      ? "Work trail"
      : THINKING_VERBS[verbIndex];

  const showEllipsis = !hasError && turn.status === "streaming";
  const showCaret = hasTimeline || turn.status === "complete";

  // Build summary
  const summaryParts = [
    toolCount > 0 ? `${toolCount} ${toolCount === 1 ? "search" : "searches"}` : "",
    sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}` : "",
  ].filter(Boolean);
  const summaryText = summaryParts.join(" · ");

  return (
    <div className="w-full max-w-full">
      <button
        type="button"
        onClick={showCaret ? () => setIsOpen((c) => !c) : undefined}
        className={cn(
          "group flex items-center gap-1.5 py-1 text-left",
          showCaret ? "cursor-pointer" : "cursor-default"
        )}
      >
        {turn.status === "streaming" && !hasTimeline && (
          <Loader2 className="size-3.5 animate-spin text-[var(--color-g-600)]" />
        )}
        <span
          className={cn(
            "text-[13px] font-medium",
            hasError
              ? "text-[var(--color-rose)]"
              : turn.status === "complete"
                ? "text-[var(--color-muted)]"
                : "text-[var(--color-ink)]"
          )}
        >
          {headerText}
          {showEllipsis && <AnimatedEllipsis />}
        </span>
        {summaryText && (
          <>
            <span className="text-[11px] text-[var(--color-muted)]">·</span>
            <span className="text-[11px] text-[var(--color-muted)]">{summaryText}</span>
          </>
        )}
        {showCaret &&
          (isOpen ? (
            <ChevronDown className="size-3.5 text-[var(--color-muted)]" />
          ) : (
            <ChevronRight className="size-3.5 text-[var(--color-muted)]" />
          ))}
      </button>

      {isOpen && (
        <div className="relative mt-1 pl-1">
          {/* Vertical connector line */}
          {hasTimeline && visibleTimeline.length > 1 && (
            <div className="absolute bottom-2 left-[14px] top-2 w-px bg-[var(--color-line)]" />
          )}

          <div className="space-y-2">
            {visibleTimeline.map((group, index) => {
              const durationStr = formatDuration(group.duration);
              const resultStr = group.resultCount !== undefined
                ? `${group.resultCount} ${group.resultCount === 1 ? "result" : "results"}`
                : null;

              // Build enriched summary
              const enrichedParts = [
                group.summary,
                resultStr && !group.summary?.includes("Found") ? resultStr : null,
                durationStr,
              ].filter(Boolean);
              const enrichedSummary = enrichedParts.join(" · ");

              return (
                <div
                  key={group.id}
                  className="relative grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--color-paper)]">
                    {getStepIcon(group.items[0])}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[13px] leading-5",
                        group.state === "running" ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"
                      )}
                    >
                      {group.label}
                      {group.state === "running" && <AnimatedEllipsis />}
                      {group.items.length > 1 && (
                        <span className="ml-1.5 shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                          {group.items.length} calls
                        </span>
                      )}
                    </p>

                    {/* Enriched Summary with duration and result count */}
                    {enrichedSummary && group.state !== "running" && (
                      <span
                        className={cn(
                          "mt-1 inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-[11px]",
                          group.state === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-[var(--color-panel)] text-[var(--color-muted)]"
                        )}
                      >
                        {group.state === "error" ? (
                          <AlertCircle className="size-3 shrink-0" />
                        ) : (
                          <CheckCircle2 className="size-3 shrink-0" />
                        )}
                        <span className="truncate">{enrichedSummary}</span>
                      </span>
                    )}

                    {/* Search queries */}
                    {group.queries.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {group.queries.map((query, i) => (
                          <span
                            key={`${query}-${i}`}
                            className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-md bg-[var(--color-panel)] px-2 py-1 text-[11px] text-[var(--color-body)]"
                          >
                            <Search className="size-3 shrink-0 text-[var(--color-muted)]" />
                            <span className="truncate">{query}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasError && (
            <p className="mt-2 text-[13px] text-[var(--color-rose)]">{turn.error?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
