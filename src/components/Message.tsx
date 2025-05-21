
import React from "react";
import { MessageCircle, User, Code, Info, AlertCircle } from "lucide-react";

interface MessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    type?: "text" | "code" | "info" | "warning";
  };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(message.timestamp));

  // Determine icon based on message type and role
  const getIcon = () => {
    if (isUser) return <User className="h-5 w-5" />;
    
    switch (message.type) {
      case "code":
        return <Code className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  // Format content based on type
  const renderContent = () => {
    if (message.type === "code") {
      return (
        <pre className="whitespace-pre-wrap overflow-x-auto p-2 rounded bg-gray-800 text-white">
          <code>{message.content}</code>
        </pre>
      );
    }
    return <p>{message.content}</p>;
  };

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
          {getIcon()}
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
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
