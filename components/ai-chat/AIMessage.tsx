import { useMemo } from "react";
import type { ChatMessage, ChatAction } from "./types";
import { SuggestedActions } from "./SuggestedActions";
import { MarkdownBlocks } from "../MarkdownBlocks";
import { parseSummaryMarkdown } from "@/lib/summary-markdown";

interface AIMessageProps {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
}

export function AIMessage({ message, onAction }: AIMessageProps) {
  const blocks = useMemo(() => parseSummaryMarkdown(message.content), [message.content]);
  return (
    <>
      <div className="ai-chat-message-content">
        <MarkdownBlocks blocks={blocks} />
      </div>
      {message.citations && message.citations.length > 0 && (
        <div className="ai-chat-citations">
          {message.citations.map((cite, i) => (
            <a
              key={i}
              href={`/dashboard/cases/${cite.caseId}`}
              className="ai-chat-citation-link"
            >
              {cite.title}
              {cite.relevance && (
                <span className="ai-chat-citation-relevance">{cite.relevance}</span>
              )}
            </a>
          ))}
        </div>
      )}
      {message.actions && message.actions.length > 0 && (
        <SuggestedActions actions={message.actions} onAction={onAction} />
      )}
    </>
  );
}
