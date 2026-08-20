"use client";

import { MessageSquare, Plus, ChevronLeft } from "lucide-react";
import type { ChatSession } from "./types";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChatHistory({
  sessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onToggle,
}: ChatHistoryProps) {
  if (!isOpen) return null;

  return (
    <div className="ai-chat-history-panel">
      <div className="ai-chat-history-header">
        <button
          type="button"
          onClick={onToggle}
          className="ai-chat-history-back"
          title="Close history"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="ai-chat-history-title">Chat History</span>
        <button
          type="button"
          onClick={onNewChat}
          className="ai-chat-history-new"
          title="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="ai-chat-history-list">
        {sessions.length === 0 ? (
          <div className="ai-chat-history-empty">
            <MessageSquare size={24} className="opacity-30" />
            <p>No previous chats</p>
            <button onClick={onNewChat} className="ai-chat-history-start">
              Start a new conversation
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectChat(session.id)}
              className={cn(
                "ai-chat-history-item",
                currentChatId === session.id && "ai-chat-history-item-active"
              )}
            >
              <div className="ai-chat-history-item-content">
                <span className="ai-chat-history-item-title">{session.title}</span>
                <span className="ai-chat-history-item-meta">
                  {session.messageCount} messages · {formatRelativeTime(session.updatedAt)}
                </span>
              </div>
              <MessageSquare size={14} className="ai-chat-history-item-icon" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
