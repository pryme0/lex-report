export type ChatMode = "research" | "draft";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: ChatCitation[];
  actions?: ChatAction[];
  toolTimeline?: TimelineItem[];
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

// Timeline types (Doow-style unified timeline)
export type TimelineItemType = "status" | "tool" | "source";
export type TimelineItemState = "running" | "complete" | "error";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  label: string;
  state: TimelineItemState;
  summary?: string;
  toolName?: string;
  payload?: TimelinePayload;
  createdAt: Date;
}

export interface TimelinePayload {
  query?: string;
  queries?: string[];
  resultCount?: number;
  casesFound?: string[];
  duration?: number;
  source?: string;
  sourceType?: "case" | "statute" | "database";
  error?: string;
}

// Stream event types from backend
export type StreamEventType =
  | "stream_start"
  | "status"
  | "tool_start"
  | "tool_result"
  | "source"
  | "content"
  | "done"
  | "error";

// Assistant turn state (unified state during streaming)
export interface AssistantTurnState {
  messageId: string;
  status: "streaming" | "complete" | "error";
  text: string;
  toolTimeline: TimelineItem[];
  error?: { message: string };
  createdAt: Date;
}

// Chat session for persistence
export interface ChatSession {
  id: string;
  caseId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// Waiting status animation verbs
export const THINKING_VERBS = [
  "Thinking",
  "Analyzing",
  "Researching",
  "Processing",
  "Reviewing",
] as const;

// Tool display names
export const TOOL_LABELS: Record<string, string> = {
  search_cases: "Searching ELR database",
  get_case_details: "Reading judgment",
  get_citator: "Checking citations",
};
