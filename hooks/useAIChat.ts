"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ChatMode, CaseContext } from "@/components/ai-chat/types";

interface UseAIChatOptions {
  caseContext: CaseContext;
}

export function useAIChat({ caseContext }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch("/api/ai/chat", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ caseId: caseContext.id, mode, messages: [...messages, userMessage] }),
        // });

        // Mock response for now
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: getMockResponse(content, mode, caseContext),
          timestamp: new Date(),
          citations: getMockCitations(content),
          actions: getMockActions(mode),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get response");
      } finally {
        setIsLoading(false);
      }
    },
    [caseContext, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}

// Mock helpers - will be removed when API is ready
function getMockResponse(query: string, mode: ChatMode, context: CaseContext): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("ratio")) {
    return `**Ratio Decidendi**\n\nThe ratio of **${context.title}** is:\n\n"${context.ratio || "The court held that..."}"\n\nThis principle establishes that...`;
  }

  if (lowerQuery.includes("fact") || lowerQuery.includes("summar")) {
    return `**Key Facts**\n\nIn **${context.title}** (${context.citation}), the material facts were:\n\n1. The appellant...\n2. The respondent...\n3. The trial court found that...\n\nThe appeal was heard by the ${context.court} in ${context.year}.`;
  }

  if (lowerQuery.includes("similar") || lowerQuery.includes("related")) {
    return `**Related Cases**\n\nBased on the legal principles in **${context.title}**, the following cases are relevant:\n\n1. **Adesanya v. President** - Similar constitutional interpretation\n2. **FRN v. Dariye** - Comparable procedural issues\n\nThese cases share common themes regarding...`;
  }

  if (mode === "draft") {
    return `**Draft Submission**\n\nRelying on the authority of **${context.title}** (${context.citation}), it is respectfully submitted that:\n\n1. The learned trial judge erred in law when...\n2. The ratio in the instant case clearly establishes...\n3. Accordingly, this Honourable Court should...\n\n*This draft can be refined in Draft Studio.*`;
  }

  return `Based on **${context.title}** (${context.citation}), decided by the ${context.court} in ${context.year}:\n\n${context.holding || "The court's holding addresses..."}\n\nWould you like me to elaborate on any specific aspect?`;
}

function getMockCitations(query: string): ChatMessage["citations"] {
  if (query.toLowerCase().includes("similar") || query.toLowerCase().includes("related")) {
    return [
      { caseId: "case-1", title: "Adesanya v. President", citation: "(1981) 2 NCLR 358", relevance: "follows" },
      { caseId: "case-2", title: "FRN v. Dariye", citation: "(2015) 10 NWLR 234", relevance: "considers" },
    ];
  }
  return undefined;
}

function getMockActions(mode: ChatMode): ChatMessage["actions"] {
  if (mode === "draft") {
    return [
      { type: "send_to_draft", label: "Open in Draft Studio" },
    ];
  }
  return [
    { type: "search_more", label: "Find more cases" },
  ];
}
