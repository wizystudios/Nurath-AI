
import React from "react";
import { MessageCircle, User } from "lucide-react";

interface MessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(message.timestamp));

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex gap-3 max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
            isUser ? "bg-primary" : "bg-purple-600"
          } text-white`}
        >
          {isUser ? <User className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">
              {isUser ? "You" : "Nurath.AI"}
            </span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <div
            className={`rounded-md p-4 text-sm ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
