"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatCitation, TimelineItem } from "@/components/ai-chat/types";
import { TOOL_LABELS } from "@/components/ai-chat/types";
import { getAccessToken } from "@/lib/api/axios";

interface SearchAnswerState {
  answer: string;
  citations: ChatCitation[];
  toolTimeline: TimelineItem[];
  chatId: string | null;
  loading: boolean;
  error: string | null;
}

const IDLE_STATE: SearchAnswerState = {
  answer: "",
  citations: [],
  toolTimeline: [],
  chatId: null,
  loading: false,
  error: null,
};

// If the backend goes quiet for this long — a dropped connection, a stalled DB call
// upstream of the first token — the fetch's reader.read() never resolves and never rejects
// on its own, so without this the "Lex is answering…" card would spin forever instead of
// failing quiet like a normal error. Reset on every chunk so a slow-but-live stream isn't
// punished, only a genuinely stuck one.
const STALL_TIMEOUT_MS = 20_000;

// A separate, un-reset ceiling on the whole request. A slow-but-technically-alive backend (a
// tool call that takes 15s due to DB contention, followed by another, followed by another) can
// keep resetting the stall timer above forever without ever going quiet for 20s straight — from
// the user's seat that's indistinguishable from being stuck, since the WorkTrail just keeps
// cycling "Thinking… Analyzing…" with no end in sight. This caps the whole thing regardless.
const MAX_DURATION_MS = 45_000;

/**
 * Fires a single, historyless question at Lex (research mode) and streams back the answer text,
 * cited cases, and a work-trail timeline (status updates + tool calls) — no session persistence
 * or chat history, since this backs the compact "AI overview" card on the search page, not a
 * conversation. Shares the timeline event shapes with useGeneralChat/useAIChat (see
 * components/ai-chat/types.ts) so the same <WorkTrail> can render "what Lex is doing" here too;
 * duplicating the SSE-parsing loop itself is a deliberate, small tradeoff to avoid dragging in
 * session-list fetching that a one-shot answer has no use for.
 */
export function useSearchAnswer() {
  const [state, setState] = useState<SearchAnswerState>(IDLE_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedOutRef = useRef(false);

  const ask = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    timedOutRef.current = false;

    // Set once, never reset — see MAX_DURATION_MS above.
    const maxTimer = setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
    }, MAX_DURATION_MS);

    const armStallTimer = () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      stallTimerRef.current = setTimeout(() => {
        timedOutRef.current = true;
        controller.abort();
      }, STALL_TIMEOUT_MS);
    };
    const disarmStallTimer = () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
      clearTimeout(maxTimer);
    };

    setState({ answer: "", citations: [], toolTimeline: [], chatId: null, loading: true, error: null });
    armStallTimer();

    let timeline: TimelineItem[] = [];
    const pushTimeline = (item: TimelineItem) => {
      timeline = [...timeline, item];
      setState((prev) => ({ ...prev, toolTimeline: timeline }));
    };
    const updateRunningTool = (
      toolName: string,
      patch: (item: TimelineItem) => TimelineItem,
    ) => {
      timeline = timeline.map((item) =>
        item.toolName === toolName && item.state === "running" ? patch(item) : item,
      );
      setState((prev) => ({ ...prev, toolTimeline: timeline }));
    };

    try {
      const token = getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lex/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: question, mode: "research", history: [], chatId: null }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Failed to get response: ${response.statusText}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      const citations: ChatCitation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        armStallTimer();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            let data: Record<string, unknown> | null = null;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              // Malformed SSE line — skip it and keep reading the stream.
            }
            if (!data) continue;

            if (currentEvent === "stream_start" && typeof data.chatId === "string") {
              setState((prev) => ({ ...prev, chatId: data.chatId as string }));
            } else if (currentEvent === "status") {
              pushTimeline({
                id: `status-${Date.now()}-${Math.random()}`,
                type: "status",
                label: (data.label as string) || (data.message as string) || "Processing",
                state: "running",
                createdAt: new Date(),
              });
            } else if (currentEvent === "tool_start") {
              const toolName = data.tool as string;
              pushTimeline({
                id: (data.callId as string) || `tool-${Date.now()}`,
                type: "tool",
                label: TOOL_LABELS[toolName] || `Running ${toolName}`,
                state: "running",
                toolName,
                payload: { query: data.query as string | undefined },
                createdAt: new Date(),
              });
            } else if (currentEvent === "tool_result") {
              const toolName = data.tool as string;
              updateRunningTool(toolName, (item) => ({
                ...item,
                state: data.success ? "complete" : "error",
                summary: data.summary as string | undefined,
                payload: {
                  ...item.payload,
                  resultCount: data.resultCount as number | undefined,
                  casesFound: data.cases as string[] | undefined,
                  duration: data.duration as number | undefined,
                  error: data.error as string | undefined,
                },
              }));
            } else if (currentEvent === "content" && typeof data.text === "string") {
              text += data.text;
              setState((prev) => ({ ...prev, answer: text, citations: [...citations], loading: true, error: null }));
            } else if (currentEvent === "source" && data.caseId) {
              citations.push({
                caseId: data.caseId as string,
                title: (data.title as string) ?? "",
                citation: (data.citation as string) ?? "",
                relevance: data.relevance as string | undefined,
              });
            } else if (currentEvent === "error") {
              throw new Error((data.message as string) || "Lex could not answer that.");
            }
          }
        }
      }

      disarmStallTimer();
      timeline = timeline.map((item) => (item.state === "running" ? { ...item, state: "complete" } : item));
      setState((prev) => ({ ...prev, answer: text, citations, toolTimeline: timeline, loading: false, error: text ? null : "No answer returned." }));
    } catch (err) {
      disarmStallTimer();
      // A newer ask() call already replaced this one (abortRef points elsewhere) — that call
      // owns state now, so stay quiet rather than clobbering its in-progress render.
      if (abortRef.current !== controller) return;

      if (controller.signal.aborted) {
        // Reaching here with signal.aborted means THIS is still the current request, so the
        // abort wasn't a supersede — it was our own timeout, or something external (e.g. the
        // component unmounting, in which case this setState is a harmless no-op). Surface it
        // rather than silently leaving the UI frozen on "Thinking…" forever.
        setState({
          answer: "",
          citations: [],
          toolTimeline: [],
          chatId: null,
          loading: false,
          error: timedOutRef.current
            ? "Lex is taking too long to respond. Please try again."
            : "The connection was interrupted. Please try again.",
        });
        return;
      }
      setState((prev) => ({ ...prev, answer: "", citations: [], loading: false, error: (err as Error).message }));
    }
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
  }, []);

  return { ...state, ask };
}
