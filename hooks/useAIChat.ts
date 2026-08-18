"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ChatMode, CaseContext } from "@/components/ai-chat/types";
import { getAccessToken } from "@/lib/api/axios";

interface UseAIChatOptions {
  caseContext: CaseContext;
}

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

export function useAIChat({ caseContext }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      setAgentSteps([]);
      setToolCalls([]);

      // Create placeholder for AI response
      const aiMessageId = `ai-${Date.now()}`;
      let streamedContent = "";
      let citations: ChatMessage["citations"] = [];

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      try {
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const token = getAccessToken();
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
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get response: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEvent = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (currentEvent) {
                  case "reasoning":
                  case "planning":
                  case "reflecting":
                    setAgentSteps((prev) => [
                      ...prev,
                      {
                        type: currentEvent as "reasoning" | "planning" | "reflecting",
                        message: data.message,
                        timestamp: new Date(),
                      },
                    ]);
                    break;

                  case "tool_call":
                    setToolCalls((prev) => [
                      ...prev,
                      {
                        tool: data.tool,
                        label: data.label,
                        status: "in_progress",
                      },
                    ]);
                    break;

                  case "tool_result":
                    setToolCalls((prev) =>
                      prev.map((tc) =>
                        tc.tool === data.tool && tc.status === "in_progress"
                          ? {
                              ...tc,
                              status: data.success ? "completed" : "error",
                              result: data.summary || data.error,
                            }
                          : tc
                      )
                    );
                    break;

                  case "content":
                    streamedContent += data.text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: streamedContent }
                          : msg
                      )
                    );
                    break;

                  case "done":
                    if (data.citations) {
                      citations = data.citations;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === aiMessageId
                            ? { ...msg, citations }
                            : msg
                        )
                      );
                    }
                    break;

                  case "error":
                    throw new Error(data.message || "Stream error");
                }

                currentEvent = "";
              } catch (parseError) {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to get response");
        // Remove the empty AI message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      } finally {
        setIsLoading(false);
        setAgentSteps([]);
        setToolCalls([]);
      }
    },
    [caseContext, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setAgentSteps([]);
    setToolCalls([]);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setAgentSteps([]);
      setToolCalls([]);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    agentSteps,
    toolCalls,
    sendMessage,
    clearMessages,
    cancelRequest,
  };
}
