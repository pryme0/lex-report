"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatAction, AssistantTurnState } from "./types";
import { THINKING_VERBS } from "./types";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { WorkTrail } from "./WorkTrail";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  assistantTurn?: AssistantTurnState | null;
  onAction?: (action: ChatAction) => void;
  onSuggestionClick?: (suggestion: string) => void;
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

export function ChatMessages({
  messages,
  isLoading,
  assistantTurn,
  onAction,
  onSuggestionClick,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [verbIndex, setVerbIndex] = useState(0);

  // Rotate thinking verbs while loading with no timeline
  const showInitialLoader = isLoading && !assistantTurn?.toolTimeline?.length && !assistantTurn?.text;

  useEffect(() => {
    if (!showInitialLoader) {
      setVerbIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setVerbIndex((i) => (i + 1) % THINKING_VERBS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [showInitialLoader]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, assistantTurn?.text, assistantTurn?.toolTimeline?.length]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="ai-chat-empty">
        <p>Ask me anything about this judgment.</p>
        <div className="ai-chat-suggestions">
          <button
            className="ai-chat-suggestion"
            onClick={() => onSuggestionClick?.("What is the ratio decidendi?")}
          >
            What is the ratio decidendi?
          </button>
          <button
            className="ai-chat-suggestion"
            onClick={() => onSuggestionClick?.("Summarize the key facts")}
          >
            Summarize the key facts
          </button>
          <button
            className="ai-chat-suggestion"
            onClick={() => onSuggestionClick?.("Find similar cases")}
          >
            Find similar cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-messages">
      {messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const isStreamingMessage = isLastMessage && msg.role === "assistant" && isLoading;

        if (msg.role === "user") {
          return <UserMessage key={msg.id} message={msg} />;
        }

        return (
          <div key={msg.id} className="ai-chat-message ai-chat-message-ai">
            <div className="ai-chat-message-avatar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="ai-chat-message-body">
              {/* Work Trail - ABOVE the message content */}
              {isStreamingMessage && assistantTurn && (
                <div className="mb-2">
                  <WorkTrail turn={assistantTurn} keepOpenAfterComplete />
                </div>
              )}

              {/* Completed message work trail (collapsed by default) */}
              {!isStreamingMessage && msg.toolTimeline && msg.toolTimeline.length > 0 && (
                <div className="mb-2">
                  <WorkTrail
                    turn={{
                      messageId: msg.id,
                      status: "complete",
                      text: msg.content,
                      toolTimeline: msg.toolTimeline,
                      createdAt: msg.timestamp,
                    }}
                  />
                </div>
              )}

              {/* Message content */}
              {isStreamingMessage ? (
                assistantTurn?.text ? (
                  <div className="ai-chat-message-content prose prose-sm">
                    {assistantTurn.text}
                    <span className="ai-chat-cursor" />
                  </div>
                ) : null
              ) : (
                <AIMessage message={msg} onAction={onAction} />
              )}
            </div>
          </div>
        );
      })}

      {/* Initial loading state (no message yet) */}
      {showInitialLoader && (
        <div className="ai-chat-message ai-chat-message-ai">
          <div className="ai-chat-message-avatar ai-chat-avatar-animated">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="ai-chat-message-body">
            <div className="ai-chat-initial-loader">
              <Loader2 className="size-3.5 animate-spin" />
              <span>
                {THINKING_VERBS[verbIndex]}
                <AnimatedEllipsis />
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className={isLoading ? "h-20" : "h-4"} />
    </div>
  );
}
