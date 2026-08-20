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

// Extract follow-up suggestions from AI response
function extractFollowUpSuggestions(content: string): string[] {
  const suggestions: string[] = [];

  // Look for patterns like "- [suggestion]" or "• [suggestion]" after "What would you like" or similar
  const followUpMatch = content.match(/(?:What would you like|Would you like|You might want|Next steps|Follow-up options)[^\n]*\n((?:[-•*]\s+.+\n?)+)/i);

  if (followUpMatch) {
    const listSection = followUpMatch[1];
    const items = listSection.match(/[-•*]\s+(.+)/g);
    if (items) {
      for (const item of items.slice(0, 3)) { // Max 3 suggestions
        const text = item.replace(/^[-•*]\s+/, '').trim();
        if (text && text.length > 5 && text.length < 100) {
          suggestions.push(text);
        }
      }
    }
  }

  return suggestions;
}

// Remove the follow-up section from content for cleaner display
function removeFollowUpSection(content: string): string {
  // Remove the follow-up section at the end
  return content.replace(/\n\n\*\*What would you like[^\n]*\*\*\n((?:[-•*]\s+.+\n?)+)$/i, '').trim();
}

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

        // Extract follow-up suggestions from completed messages
        const followUpSuggestions = !isStreamingMessage ? extractFollowUpSuggestions(msg.content) : [];
        const cleanContent = followUpSuggestions.length > 0 ? removeFollowUpSection(msg.content) : msg.content;

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
              {/* Work Trail - ONLY during streaming */}
              {isStreamingMessage && assistantTurn && (
                <div className="mb-2">
                  <WorkTrail turn={assistantTurn} />
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
                <>
                  <AIMessage
                    message={{ ...msg, content: cleanContent }}
                    onAction={onAction}
                  />

                  {/* Follow-up suggestion buttons */}
                  {followUpSuggestions.length > 0 && (
                    <div className="ai-chat-followup-buttons">
                      {followUpSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          type="button"
                          className="ai-chat-followup-btn"
                          onClick={() => onSuggestionClick?.(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </>
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
