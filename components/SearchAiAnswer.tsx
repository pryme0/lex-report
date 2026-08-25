"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import { AIMessage } from "./ai-chat/AIMessage";
import { WorkTrail } from "./ai-chat/WorkTrail";
import { useSearchAnswer } from "@/hooks/useSearchAnswer";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { AssistantTurnState, ChatMessage } from "./ai-chat/types";

const COLLAPSE_THRESHOLD_CHARS = 480;

interface SearchAiAnswerProps {
  query: string;
}

/** The "AI overview" card shown above the judgment list for question-style searches — see
 * lib/search/is-question.ts for when the search page decides to render this at all. */
export function SearchAiAnswer({ query }: SearchAiAnswerProps) {
  const { answer, citations, toolTimeline, chatId, loading, error, ask } = useSearchAnswer();
  const [expanded, setExpanded] = useState(false);
  const lastAskedRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAskedRef.current === query) return;
    lastAskedRef.current = query;
    setExpanded(false);
    void ask(query);
  }, [query, ask]);

  const isLong = answer.length > COLLAPSE_THRESHOLD_CHARS;
  const message: ChatMessage = {
    id: "search-ai-answer",
    role: "assistant",
    content: answer,
    timestamp: new Date(),
    citations,
  };
  // Status stays "streaming"/"complete" even on failure — the top-level error+retry block
  // below already owns that message, so WorkTrail is only asked to show the process (and any
  // individual failed tool call), not repeat the same failure a second time as "Failed".
  const turn: AssistantTurnState = {
    messageId: "search-ai-answer",
    status: loading ? "streaming" : "complete",
    text: answer,
    toolTimeline,
    createdAt: new Date(),
  };

  return (
    <section className="search-ai-answer" aria-label="AI-generated answer">
      <div className="search-ai-answer-head">
        <Sparkles size={14} aria-hidden="true" />
        <h3>AI overview</h3>
      </div>

      {/* Shows what Lex is doing — searching the archive, reading a case, etc. — while the
          answer streams, then collapses to a small toggle once it's done. */}
      <WorkTrail turn={turn} />

      {error && !answer && (
        <div className="search-ai-answer-error">
          <p>{error}</p>
          <button
            type="button"
            className="search-ai-answer-retry"
            onClick={() => {
              lastAskedRef.current = null;
              void ask(query);
            }}
          >
            <RotateCcw size={12} aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {answer && (
        <div
          className={cn(
            "search-ai-answer-body",
            isLong && !expanded && "search-ai-answer-clamped",
          )}
        >
          <AIMessage message={message} />
        </div>
      )}

      {!loading && answer && (
        <footer className="search-ai-answer-footer">
          {isLong && (
            <button
              type="button"
              className="search-ai-answer-toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronDown size={13} className={cn(expanded && "search-ai-answer-toggle-open")} aria-hidden="true" />
            </button>
          )}
          {chatId && (
            <a className="search-ai-answer-continue" href={routes.askAi(chatId)}>
              Continue in AI chat <ArrowRight size={12} aria-hidden="true" />
            </a>
          )}
        </footer>
      )}
    </section>
  );
}
