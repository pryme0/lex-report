"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

export function AIChatButton({ isOpen, onClick, hasUnread }: AIChatButtonProps) {
  return (
    <button
      className={cn("ai-chat-button", isOpen && "is-open")}
      onClick={onClick}
      aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
    >
      {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      {!isOpen && hasUnread && <span className="ai-chat-unread" />}
    </button>
  );
}
