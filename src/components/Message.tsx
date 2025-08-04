
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
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] ${
          isUser ? "ml-auto" : "mr-auto"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground/60">{time}</span>
          </div>
          <div
            className={`text-sm font-medium ${
              isUser
                ? "text-foreground"
                : "text-foreground p-3"
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
