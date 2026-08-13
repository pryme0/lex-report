"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatAction } from "./types";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onAction?: (action: ChatAction) => void;
}

export function ChatMessages({ messages, isLoading, onAction }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="ai-chat-empty">
        <p>Ask me anything about this judgment.</p>
        <div className="ai-chat-suggestions">
          <button className="ai-chat-suggestion">What is the ratio decidendi?</button>
          <button className="ai-chat-suggestion">Summarize the key facts</button>
          <button className="ai-chat-suggestion">Find similar cases</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-messages">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserMessage key={msg.id} message={msg} />
        ) : (
          <AIMessage key={msg.id} message={msg} onAction={onAction} />
        )
      )}
      {isLoading && (
        <div className="ai-chat-message ai-chat-message-ai">
          <div className="ai-chat-typing">
            <Loader2 size={16} className="ai-chat-spinner" />
            <span>Thinking...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
