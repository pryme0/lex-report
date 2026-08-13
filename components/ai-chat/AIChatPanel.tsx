"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMode, ChatMessage, CaseContext, ChatAction } from "./types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ContextBadge } from "./ContextBadge";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext: CaseContext;
  messages: ChatMessage[];
  isLoading?: boolean;
  onSend: (message: string, mode: ChatMode) => void;
  onAction?: (action: ChatAction) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export function AIChatPanel({
  isOpen,
  onClose,
  caseContext,
  messages,
  isLoading,
  onSend,
  onAction,
  onSuggestionClick,
}: AIChatPanelProps) {
  const [mode, setMode] = useState<ChatMode>("research");

  const handleSend = (message: string) => {
    onSend(message, mode);
  };

  const handleSuggestionClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("ai-chat-suggestion")) {
      const suggestion = target.textContent || "";
      if (onSuggestionClick) {
        onSuggestionClick(suggestion);
      } else {
        onSend(suggestion, mode);
      }
    }
  };

  return (
    <div className={cn("ai-chat-panel", isOpen && "is-open")}>
      <ChatHeader mode={mode} onModeChange={setMode} onClose={onClose} />
      <ContextBadge caseContext={caseContext} />
      <div className="ai-chat-body" onClick={handleSuggestionClick}>
        <ChatMessages messages={messages} isLoading={isLoading} onAction={onAction} />
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
