"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMode, ChatMessage, CaseContext, ChatAction, AssistantTurnState, ChatSession } from "./types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ContextBadge } from "./ContextBadge";
import { ChatHistory } from "./ChatHistory";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext: CaseContext;
  messages: ChatMessage[];
  isLoading?: boolean;
  assistantTurn?: AssistantTurnState | null;
  chatId?: string | null;
  sessions?: ChatSession[];
  onSend: (message: string, mode: ChatMode) => void;
  onAction?: (action: ChatAction) => void;
  onLoadChat?: (chatId: string) => void;
  onNewChat?: () => void;
}

export function AIChatPanel({
  isOpen,
  onClose,
  caseContext,
  messages,
  isLoading,
  assistantTurn,
  chatId,
  sessions = [],
  onSend,
  onAction,
  onLoadChat,
  onNewChat,
}: AIChatPanelProps) {
  const [mode, setMode] = useState<ChatMode>("research");
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSend = (message: string) => {
    onSend(message, mode);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion, mode);
  };

  const handleSelectChat = (selectedChatId: string) => {
    onLoadChat?.(selectedChatId);
    setHistoryOpen(false);
  };

  const handleNewChat = () => {
    onNewChat?.();
    setHistoryOpen(false);
  };

  return (
    <div className={cn("ai-chat-panel", isOpen && "is-open")}>
      {/* Chat History Sidebar */}
      {onLoadChat && (
        <ChatHistory
          sessions={sessions}
          currentChatId={chatId || null}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen(!historyOpen)}
        />
      )}

      <ChatHeader mode={mode} onModeChange={setMode} onClose={onClose} />
      <ContextBadge caseContext={caseContext} />
      <div className="ai-chat-body">
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          assistantTurn={assistantTurn}
          onAction={onAction}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
