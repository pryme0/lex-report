"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatAction } from "./types";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { Loader2, Search, FileText, Link2, Check, X } from "lucide-react";

interface ToolCallState {
  tool: string;
  label: string;
  status: "in_progress" | "completed" | "error";
  result?: string;
}

interface AgentStep {
  type: "reasoning" | "planning" | "reflecting";
  message: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  agentSteps?: AgentStep[];
  toolCalls?: ToolCallState[];
  onAction?: (action: ChatAction) => void;
}

const TOOL_ICONS: Record<string, typeof Search> = {
  search_cases: Search,
  get_case_details: FileText,
  get_citator: Link2,
};

const STEP_ICONS: Record<AgentStep["type"], string> = {
  reasoning: "💭",
  planning: "📋",
  reflecting: "🔍",
};

export function ChatMessages({
  messages,
  isLoading,
  agentSteps = [],
  toolCalls = [],
  onAction,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, agentSteps, toolCalls]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="ai-chat-empty">
        <p>Ask me anything about this judgment.</p>
        <div className="ai-chat-suggestions">
          <button className="ai-chat-suggestion">What is the ratio decidendi?</button>
          <button className="ai-chat-suggestion">Summarize the key facts</button>
          <button className="ai-chat-suggestion">Find similar cases</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-messages">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserMessage key={msg.id} message={msg} />
        ) : (
          <AIMessage key={msg.id} message={msg} onAction={onAction} />
        )
      )}
      {isLoading && (agentSteps.length > 0 || toolCalls.length > 0) && (
        <div className="ai-chat-agent-status">
          {agentSteps.length > 0 && (
            <div className="ai-chat-agent-steps">
              {agentSteps.map((step, i) => (
                <div
                  key={`step-${i}`}
                  className={`ai-chat-agent-step ai-chat-agent-step-${step.type}`}
                >
                  <span className="ai-chat-step-icon">{STEP_ICONS[step.type]}</span>
                  <span className="ai-chat-step-message">{step.message}</span>
                </div>
              ))}
            </div>
          )}
          {toolCalls.length > 0 && (
            <div className="ai-chat-tool-calls">
              {toolCalls.map((tc, i) => {
                const Icon = TOOL_ICONS[tc.tool] || Search;
                return (
                  <div
                    key={`${tc.tool}-${i}`}
                    className={`ai-chat-tool-call ai-chat-tool-call-${tc.status}`}
                  >
                    <div className="ai-chat-tool-call-header">
                      {tc.status === "in_progress" ? (
                        <Loader2 size={12} className="ai-chat-spinner" />
                      ) : tc.status === "completed" ? (
                        <Check size={12} className="ai-chat-tool-check" />
                      ) : (
                        <X size={12} className="ai-chat-tool-error" />
                      )}
                      <Icon size={12} />
                      <span>{tc.label}</span>
                    </div>
                    {tc.result && (
                      <div className="ai-chat-tool-call-result">{tc.result}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
