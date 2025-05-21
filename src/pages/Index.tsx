
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Code, HelpCircle } from "lucide-react";
import SkillLevelSelector from "@/components/SkillLevelSelector";
import LanguageSelector, { Language } from "@/components/LanguageSelector";
import Message from "@/components/Message";
import VoiceInput from "@/components/VoiceInput";
import UserAuthButton from "@/components/UserAuthButton";

// Define message type
type MessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "code" | "info" | "warning";
};

// Define skill levels
export type SkillLevel = "beginner" | "intermediate" | "advanced";

// Define user type
type UserType = {
  id: string;
  name: string;
  email: string;
  skillLevel: SkillLevel;
  language: Language;
} | null;

const Index = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [language, setLanguage] = useState<Language>("en");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<UserType>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message on first load
  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      role: "assistant",
      content: language === "en" 
        ? `Welcome to Nurath.AI! I'm here to help you with technology questions. Your current skill level is set to ${skillLevel}. How can I assist you today?`
        : `Karibu kwenye Nurath.AI! Niko hapa kukusaidia na maswali ya teknolojia. Kiwango chako cha ujuzi kimewekwa kuwa ${getSkillLevelInSwahili(skillLevel)}. Nawezaje kukusaidia leo?`,
      timestamp: new Date(),
      type: "info"
    };
    setMessages([welcomeMessage]);
  }, [language]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get skill level name in Swahili
  const getSkillLevelInSwahili = (level: SkillLevel): string => {
    switch (level) {
      case "beginner": return "mwanafunzi";
      case "intermediate": return "wastani";
      case "advanced": return "mtaalamu";
      default: return "mwanafunzi";
    }
  };

  // Handle skill level change
  const handleSkillLevelChange = (level: SkillLevel) => {
    setSkillLevel(level);
    toast.success(language === "en" 
      ? `Skill level updated to ${level}`
      : `Kiwango cha ujuzi kimesasishwa kuwa ${getSkillLevelInSwahili(level)}`
    );
    
    // If user is logged in, update their preferences
    if (user) {
      setUser({
        ...user,
        skillLevel: level
      });
    }
  };

  // Handle language change
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast.success(lang === "en" 
      ? "Language changed to English"
      : "Lugha imebadilishwa kuwa Kiswahili"
    );

    // If user is logged in, update their preferences
    if (user) {
      setUser({
        ...user,
        language: lang
      });
    }
  };

  // Handle login
  const handleLogin = (email: string, password: string) => {
    // This would normally validate against a backend
    // For now, we'll just simulate a successful login
    setUser({
      id: "user1",
      name: "Demo User",
      email,
      skillLevel,
      language,
    });
  };

  // Handle signup
  const handleSignup = (email: string, password: string, name: string) => {
    // This would normally create a new account in the backend
    // For now, we'll just simulate a successful signup and login
    setUser({
      id: "user1",
      name,
      email,
      skillLevel,
      language,
    });
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
  };

  // Handle voice input
  const handleVoiceInput = (text: string) => {
    setInputValue(text);
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
      const aiResponse = generateAIResponse(inputValue, skillLevel, language);
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        type: aiResponse.type
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Generate AI response based on input, skill level, and language
  const generateAIResponse = (input: string, level: SkillLevel, lang: Language): { content: string, type?: "text" | "code" | "info" | "warning" } => {
    // This is a placeholder for actual AI integration
    const lowerInput = input.toLowerCase();
    
    // Example of code response
    if (lowerInput.includes("code") || lowerInput.includes("example") || lowerInput.includes("syntax")) {
      if (lowerInput.includes("html")) {
        return {
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello World</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>This is a simple HTML page.</p>\n</body>\n</html>`,
          type: "code"
        };
      }
      if (lowerInput.includes("css")) {
        return {
          content: `body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\nh1 {\n  color: navy;\n}`,
          type: "code"
        };
      }
      if (lowerInput.includes("javascript") || lowerInput.includes("js")) {
        return {
          content: `// Simple JavaScript function\nfunction greet(name) {\n  return \`Hello, \${name}! Welcome to coding.\`;\n}\n\nconsole.log(greet('Developer'));`,
          type: "code"
        };
      }
    }

    // Handle regular text responses based on language
    if (lang === "sw") {
      if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("habari")) {
        return {
          content: `Habari! Nawezaje kukusaidia na maswali yako ya teknolojia leo? Ninaweza kukupa mwongozo kulingana na kiwango chako cha ${getSkillLevelInSwahili(level)}.`
        };
      }
      
      if (lowerInput.includes("react")) {
        if (level === "beginner") {
          return {
            content: "React ni maktaba ya JavaScript inayotumika kuunda kiolesura cha mtumiaji. Huwaruhusu waandaaji kutengeneza vipengele vya UI vinavyoweza kutumika tena."
          };
        } else if (level === "intermediate") {
          return {
            content: "React hutumia DOM pepe kurahisisha utendaji wa kiolesura. Ungependa kujifunza kuhusu hooks na usimamizi wa hali?"
          };
        } else {
          return {
            content: "Kwa maendeleo ya hali ya juu ya React, fikiria kuchunguza mbinu za uboreshaji wa utendaji kama vile memo, useMemo, na useCallback. Unaweza pia kutazama React Server Components au suluhisho za hali ya juu za usimamizi wa hali."
          };
        }
      }
      
      // Default response in Swahili
      return {
        content: `Kulingana na kiwango chako cha ${getSkillLevelInSwahili(level)}, ningependekeza kuanza na misingi na polepole kujenga maarifa yako. Kuna jambo mahususi kuhusu "${input}" ungependa kujifunza?`
      };
    } else {
      // English responses (same as before)
      if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        return {
          content: `Hello! How can I help you with your ${level}-level tech questions today?`
        };
      }
      
      if (lowerInput.includes("react")) {
        if (level === "beginner") {
          return {
            content: "React is a JavaScript library for building user interfaces. It lets you create reusable UI components."
          };
        } else if (level === "intermediate") {
          return {
            content: "React uses a virtual DOM to optimize rendering performance. You might want to learn about hooks and state management next."
          };
        } else {
          return {
            content: "For advanced React development, consider exploring performance optimization techniques like memo, useMemo, and useCallback. You might also want to look into React Server Components or advanced state management solutions."
          };
        }
      }
      
      if (lowerInput.includes("css") || lowerInput.includes("style")) {
        if (level === "beginner") {
          return {
            content: "CSS (Cascading Style Sheets) is used to style web pages. You can change colors, fonts, and layouts with it."
          };
        } else if (level === "intermediate") {
          return {
            content: "For more complex styling, consider learning about Flexbox and CSS Grid for layouts, and CSS variables for maintainable code."
          };
        } else {
          return {
            content: "At your level, you might want to explore CSS-in-JS libraries, CSS architecture patterns like BEM or SMACSS, or advanced animations using CSS keyframes and transitions."
          };
        }
      }
      
      // Default response
      return {
        content: `Based on your ${level} skill level, I'd recommend starting with the fundamentals and gradually building up your knowledge. Is there something specific about "${input}" you'd like to learn?`
      };
    }
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
        <div className="flex items-center gap-3">
          <LanguageSelector 
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
          <SkillLevelSelector 
            currentLevel={skillLevel}
            onLevelChange={handleSkillLevelChange}
          />
          <UserAuthButton 
            isLoggedIn={!!user}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onLogout={handleLogout}
            username={user?.name}
          />
        </div>
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
            placeholder={language === "en" ? "Ask Nurath.AI a question..." : "Uliza Nurath.AI swali..."}
            className="flex-1"
          />
          <VoiceInput onTranscription={handleVoiceInput} disabled={isTyping} />
          <Button type="submit" disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
              <Code className="h-3 w-3 mr-1" /> Tutorial
            </Button>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
              <HelpCircle className="h-3 w-3 mr-1" /> Help
            </Button>
          </div>
          <div>
            {language === "en" ? "Ask me anything about technology!" : "Niulize chochote kuhusu teknolojia!"}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Index;
