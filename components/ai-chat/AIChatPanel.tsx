"use client";

import { useState } from "react";
import { X, Search, PenTool, Clock, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMode, ChatMessage, CaseContext, ChatAction, AssistantTurnState, ChatSession } from "./types";
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
  const [expanded, setExpanded] = useState(false);

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
    <div className={cn("ai-chat-panel", isOpen && "is-open", expanded && "is-expanded")}>
      {/* Chat History Sidebar (overlay) */}
      {historyOpen && onLoadChat && (
        <ChatHistory
          sessions={sessions}
          currentChatId={chatId || null}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen(false)}
        />
      )}

      {/* Header with integrated controls */}
      <div className="ai-chat-header">
        {/* Left: History toggle */}
        {onLoadChat && (
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="ai-chat-history-toggle"
            title="Chat history"
          >
            <Clock size={14} />
          </button>
        )}

        {/* Title */}
        <div className="ai-chat-header-title">
          <span>AI Assistant</span>
        </div>

        {/* Mode toggle */}
        <div className="ai-chat-mode-toggle">
          <button
            className={cn("ai-chat-mode-btn", mode === "research" && "active")}
            onClick={() => setMode("research")}
          >
            <Search size={14} />
            Research
          </button>
          <button
            className={cn("ai-chat-mode-btn", mode === "draft" && "active")}
            onClick={() => setMode("draft")}
          >
            <PenTool size={14} />
            Draft
          </button>
        </div>

        {/* Expand/collapse */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="ai-chat-expand-btn"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Close */}
        <button className="ai-chat-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

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
