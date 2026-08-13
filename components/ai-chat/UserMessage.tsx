import type { ChatMessage } from "./types";

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="ai-chat-message ai-chat-message-user">
      <div className="ai-chat-message-content">{message.content}</div>
    </div>
  );
}
