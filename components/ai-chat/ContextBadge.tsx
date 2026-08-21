import { FileText } from "lucide-react";
import type { CaseContext } from "./types";

interface ContextBadgeProps {
  caseContext: CaseContext;
}

export function ContextBadge({ caseContext }: ContextBadgeProps) {
  return (
    <div className="ai-chat-context">
      <FileText size={14} />
      <span className="ai-chat-context-label">Reading:</span>
      <span className="ai-chat-context-title">{caseContext.title}</span>
    </div>
  );
}
