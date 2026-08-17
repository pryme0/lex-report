"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ChatMode, CaseContext, ChatAction } from "@/components/ai-chat/types";
import { getToken } from "@/lib/api/axios";

interface UseAIChatOptions {
  caseContext: CaseContext;
}

interface LexChatResponse {
  content: string;
  citations?: Array<{
    caseId: string;
    title: string;
    citation: string;
    relevance?: string;
  }>;
  actions?: Array<{
    type: "send_to_draft" | "view_case" | "search_more";
    label: string;
    payload?: Record<string, unknown>;
  }>;
  toolsUsed?: string[];
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
        // Build history from previous messages
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const token = getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/lex/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message: content,
              mode,
              history,
              caseContext: {
                id: caseContext.id,
                title: caseContext.title,
                citation: caseContext.citation,
                court: caseContext.court,
                year: caseContext.year,
                ratio: caseContext.ratio,
                holding: caseContext.holding,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get response: ${response.statusText}`);
        }

        const data: LexChatResponse = await response.json();

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
          citations: data.citations,
          actions: data.actions,
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
