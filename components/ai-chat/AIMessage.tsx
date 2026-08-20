import type { ChatMessage, ChatAction } from "./types";
import { SuggestedActions } from "./SuggestedActions";

interface AIMessageProps {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
}

export function AIMessage({ message, onAction }: AIMessageProps) {
  return (
    <>
      <div
        className="ai-chat-message-content"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
      />
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

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
