export type ChatMode = "research" | "draft";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: ChatCitation[];
  actions?: ChatAction[];
}

export interface ChatCitation {
  caseId: string;
  title: string;
  citation: string;
  relevance?: string;
}

export interface ChatAction {
  type: "send_to_draft" | "view_case" | "search_more";
  label: string;
  payload?: Record<string, unknown>;
}

export interface CaseContext {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  ratio: string;
  holding: string;
  fullText?: string;
}

export interface ChatSelection {
  text: string;
  paragraph?: number;
}
