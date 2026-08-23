"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  ChatMessage,
  ChatMode,
  TimelineItem,
  AssistantTurnState,
  ChatSession,
} from "@/components/ai-chat/types";
import { TOOL_LABELS } from "@/components/ai-chat/types";
import { getAccessToken } from "@/lib/api/axios";

export function useGeneralChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [assistantTurn, setAssistantTurn] = useState<AssistantTurnState | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = useCallback(async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lex/chats`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const loadChat = useCallback(async (sessionId: string) => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lex/chats/${sessionId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        setChatId(sessionId);
        setMessages(
          data.messages.map((m: Record<string, unknown>) => ({
            ...m,
            timestamp: new Date(m.timestamp as string),
          }))
        );
      }
    } catch {
      setError("Failed to load chat history");
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode) => {
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

      const aiMessageId = `ai-${Date.now()}`;
      const initialTurn: AssistantTurnState = {
        messageId: aiMessageId,
        status: "streaming",
        text: "",
        toolTimeline: [],
        createdAt: new Date(),
      };
      setAssistantTurn(initialTurn);

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          toolTimeline: [],
        },
      ]);

      let streamedContent = "";
      let finalTimeline: TimelineItem[] = [];

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
              chatId,
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
                  case "stream_start":
                    if (data.chatId) {
                      setChatId(data.chatId);
                    }
                    break;

                  case "status": {
                    const statusItem: TimelineItem = {
                      id: `status-${Date.now()}-${Math.random()}`,
                      type: "status",
                      label: data.label || data.message || "Processing",
                      state: "running",
                      createdAt: new Date(),
                    };
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, toolTimeline: [...prev.toolTimeline, statusItem] }
                        : prev
                    );
                    finalTimeline.push(statusItem);
                    break;
                  }

                  case "tool_start": {
                    const toolItem: TimelineItem = {
                      id: data.callId || `tool-${Date.now()}`,
                      type: "tool",
                      label: TOOL_LABELS[data.tool] || `Running ${data.tool}`,
                      state: "running",
                      toolName: data.tool,
                      payload: { query: data.query, queries: data.queries },
                      createdAt: new Date(),
                    };
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, toolTimeline: [...prev.toolTimeline, toolItem] }
                        : prev
                    );
                    finalTimeline.push(toolItem);
                    break;
                  }

                  case "tool_result": {
                    const updateTimeline = (items: TimelineItem[]) =>
                      items.map((item) =>
                        item.toolName === data.tool && item.state === "running"
                          ? {
                              ...item,
                              state: (data.success ? "complete" : "error") as TimelineItem["state"],
                              summary: data.summary,
                              payload: {
                                ...item.payload,
                                resultCount: data.resultCount,
                                casesFound: data.cases,
                                duration: data.duration,
                                error: data.error,
                              },
                            }
                          : item
                      );
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, toolTimeline: updateTimeline(prev.toolTimeline) }
                        : prev
                    );
                    finalTimeline = updateTimeline(finalTimeline);
                    break;
                  }

                  case "source": {
                    const sourceItem: TimelineItem = {
                      id: `source-${Date.now()}`,
                      type: "source",
                      label: data.title ? `Using ${data.title}` : "Source added",
                      state: "complete",
                      summary: data.citation,
                      payload: { source: data.caseId, sourceType: "case" },
                      createdAt: new Date(),
                    };
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, toolTimeline: [...prev.toolTimeline, sourceItem] }
                        : prev
                    );
                    finalTimeline.push(sourceItem);
                    break;
                  }

                  case "content":
                    streamedContent += data.text;
                    setAssistantTurn((prev) =>
                      prev ? { ...prev, text: streamedContent } : prev
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId ? { ...msg, content: streamedContent } : msg
                      )
                    );
                    break;

                  case "done": {
                    const completeTimeline = finalTimeline.map((item) =>
                      item.state === "running" ? { ...item, state: "complete" as const } : item
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? {
                              ...msg,
                              content: streamedContent,
                              citations: data.citations,
                              toolTimeline: completeTimeline,
                            }
                          : msg
                      )
                    );
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, status: "complete", toolTimeline: completeTimeline }
                        : prev
                    );
                    loadChatSessions();
                    break;
                  }

                  case "error":
                    setAssistantTurn((prev) =>
                      prev
                        ? { ...prev, status: "error", error: { message: data.message } }
                        : prev
                    );
                    throw new Error(data.message || "Stream error");
                }

                currentEvent = "";
              } catch (parseError) {
                if (parseError instanceof Error && parseError.message !== "Stream error") {
                  // Skip malformed JSON
                } else {
                  throw parseError;
                }
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorMessage = err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
        setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      } finally {
        setIsLoading(false);
        setTimeout(() => setAssistantTurn(null), 300);
      }
    },
    [messages, chatId, loadChatSessions]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setAssistantTurn(null);
    setChatId(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setAssistantTurn(null);
    }
  }, []);

  const startNewChat = useCallback(() => {
    clearMessages();
    loadChatSessions();
  }, [clearMessages, loadChatSessions]);

  const deleteChat = useCallback(async (sessionId: string) => {
    try {
      const token = getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lex/chats/${sessionId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (chatId === sessionId) {
        clearMessages();
      }
      loadChatSessions();
    } catch {
      // Silently fail
    }
  }, [chatId, clearMessages, loadChatSessions]);

  return {
    messages,
    isLoading,
    error,
    chatId,
    sessions,
    assistantTurn,
    sendMessage,
    clearMessages,
    cancelRequest,
    loadChat,
    startNewChat,
    deleteChat,
  };
}
