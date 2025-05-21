
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import SkillLevelSelector from "@/components/SkillLevelSelector";
import Message from "@/components/Message";

// Define message type
type MessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Define skill levels
export type SkillLevel = "beginner" | "intermediate" | "advanced";

const Index = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message on first load
  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      role: "assistant",
      content: `Welcome to Nurath.AI! I'm here to help you with technology questions. Your current skill level is set to ${skillLevel}. How can I assist you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle skill level change
  const handleSkillLevelChange = (level: SkillLevel) => {
    setSkillLevel(level);
    toast.success(`Skill level updated to ${level}`);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    
    // Simulate AI response
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, skillLevel);
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Generate AI response based on input and skill level
  const generateAIResponse = (input: string, level: SkillLevel): string => {
    // This is a placeholder for actual AI integration
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return `Hello! How can I help you with your ${level}-level tech questions today?`;
    }
    
    if (lowerInput.includes("react")) {
      if (level === "beginner") {
        return "React is a JavaScript library for building user interfaces. It lets you create reusable UI components.";
      } else if (level === "intermediate") {
        return "React uses a virtual DOM to optimize rendering performance. You might want to learn about hooks and state management next.";
      } else {
        return "For advanced React development, consider exploring performance optimization techniques like memo, useMemo, and useCallback. You might also want to look into React Server Components or advanced state management solutions.";
      }
    }
    
    if (lowerInput.includes("css") || lowerInput.includes("style")) {
      if (level === "beginner") {
        return "CSS (Cascading Style Sheets) is used to style web pages. You can change colors, fonts, and layouts with it.";
      } else if (level === "intermediate") {
        return "For more complex styling, consider learning about Flexbox and CSS Grid for layouts, and CSS variables for maintainable code.";
      } else {
        return "At your level, you might want to explore CSS-in-JS libraries, CSS architecture patterns like BEM or SMACSS, or advanced animations using CSS keyframes and transitions.";
      }
    }
    
    // Default response
    return `Based on your ${level} skill level, I'd recommend starting with the fundamentals and gradually building up your knowledge. Is there something specific about ${input} you'd like to learn?`;
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-800 text-white">
        <div className="flex items-center">
          <MessageCircle className="mr-2 h-6 w-6" />
          <h1 className="text-xl font-bold">Nurath.AI</h1>
          <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
            by NK Technology (Tanzania)
          </span>
        </div>
        <SkillLevelSelector 
          currentLevel={skillLevel}
          onLevelChange={handleSkillLevelChange}
        />
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex space-x-1 items-center">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="ml-2">Nurath is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-muted/20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Nurath.AI a question..."
            className="flex-1"
          />
          <Button type="submit" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Index;
