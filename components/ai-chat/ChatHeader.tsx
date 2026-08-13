import { X, Search, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMode } from "./types";

interface ChatHeaderProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onClose: () => void;
}

export function ChatHeader({ mode, onModeChange, onClose }: ChatHeaderProps) {
  return (
    <div className="ai-chat-header">
      <div className="ai-chat-header-title">
        <span>AI Assistant</span>
      </div>

      <div className="ai-chat-mode-toggle">
        <button
          className={cn("ai-chat-mode-btn", mode === "research" && "active")}
          onClick={() => onModeChange("research")}
        >
          <Search size={14} />
          Research
        </button>
        <button
          className={cn("ai-chat-mode-btn", mode === "draft" && "active")}
          onClick={() => onModeChange("draft")}
        >
          <PenTool size={14} />
          Draft
        </button>
      </div>

      <button className="ai-chat-close" onClick={onClose} aria-label="Close">
        <X size={18} />
      </button>
    </div>
  );
}
