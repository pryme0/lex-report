"use client";

import { useState } from "react";
import { Plus, MessageSquare, Trash2, Search, PenTool, Send, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { ChatMessages } from "./ai-chat/ChatMessages";
import type { ChatMode, ChatSession } from "./ai-chat/types";

function ChatSidebar({
  sessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: {
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}) {
  return (
    <aside className="chat-page-sidebar">
      <button className="chat-new-btn" onClick={onNewChat}>
        <Plus size={18} />
        New chat
      </button>

      <div className="chat-sessions-list">
        {sessions.length === 0 ? (
          <p className="chat-sessions-empty">No previous chats</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "chat-session-item",
                currentChatId === session.id && "active"
              )}
            >
              <button
                className="chat-session-btn"
                onClick={() => onSelectChat(session.id)}
              >
                <MessageSquare size={16} />
                <span className="chat-session-title">
                  {session.title || "Untitled chat"}
                </span>
              </button>
              <button
                className="chat-session-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                aria-label="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) {
  const suggestions = [
    "What are the leading cases on fundamental rights in Nigeria?",
    "Explain the doctrine of judicial precedent",
    "Find cases on breach of contract in commercial disputes",
    "What is the standard of proof in criminal cases?",
  ];

  return (
    <div className="chat-empty-state">
      <div className="chat-empty-icon">
        <Scale size={48} />
      </div>
      <h1 className="chat-empty-title">LexReport AI</h1>
      <p className="chat-empty-subtitle">
        Your AI-powered legal research assistant. Search cases, analyze judgments, and draft legal documents.
      </p>
      <div className="chat-suggestions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="chat-suggestion-btn"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
  mode,
  onModeChange,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <div className="chat-mode-toggle">
          <button
            type="button"
            className={cn("chat-mode-btn", mode === "research" && "active")}
            onClick={() => onModeChange("research")}
          >
            <Search size={16} />
            Research
          </button>
          <button
            type="button"
            className={cn("chat-mode-btn", mode === "draft" && "active")}
            onClick={() => onModeChange("draft")}
          >
            <PenTool size={16} />
            Draft
          </button>
        </div>
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            disabled={disabled}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={disabled || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}

export function ChatPage() {
  const [mode, setMode] = useState<ChatMode>("research");
  const {
    messages,
    isLoading,
    chatId,
    sessions,
    assistantTurn,
    sendMessage,
    loadChat,
    startNewChat,
    deleteChat,
  } = useGeneralChat();

  const handleSend = (message: string) => {
    sendMessage(message, mode);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion, mode);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-page">
      <ChatSidebar
        sessions={sessions}
        currentChatId={chatId}
        onSelectChat={loadChat}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
      />

      <main className="chat-page-main">
        <div className="chat-page-content">
          {hasMessages ? (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              assistantTurn={assistantTurn}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          mode={mode}
          onModeChange={setMode}
        />
      </main>
    </div>
  );
}
