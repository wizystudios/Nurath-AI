
import React from "react";

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

  // Format content based on type
  const renderContent = () => {
    if (message.type === "code") {
      return (
        <pre className="whitespace-pre-wrap overflow-x-auto">
          <code>{message.content}</code>
        </pre>
      );
    }
    return <p>{message.content}</p>;
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? "ml-auto" : "mr-auto"}`}>
        <div>
          <span className="text-xs text-muted-foreground/60 mb-1 block">{time}</span>
          <div className="text-sm font-medium text-foreground">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
