import { Send, ExternalLink, Search } from "lucide-react";
import type { ChatAction } from "./types";

interface SuggestedActionsProps {
  actions: ChatAction[];
  onAction?: (action: ChatAction) => void;
}

const ACTION_ICONS = {
  send_to_draft: Send,
  view_case: ExternalLink,
  search_more: Search,
};

export function SuggestedActions({ actions, onAction }: SuggestedActionsProps) {
  return (
    <div className="ai-chat-actions">
      {actions.map((action, i) => {
        const Icon = ACTION_ICONS[action.type] || Send;
        return (
          <button
            key={i}
            className="ai-chat-action-btn"
            onClick={() => onAction?.(action)}
          >
            <Icon size={12} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
