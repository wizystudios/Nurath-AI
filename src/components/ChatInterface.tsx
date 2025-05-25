
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, Code, Database, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const learningTopics = [
  {
    title: "Learn HTML",
    description: "Master the foundation of web development",
    icon: <Code className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    prompt: "I want to learn HTML from basics. Can you start with a beginner-friendly introduction?"
  },
  {
    title: "Learn CSS",
    description: "Style beautiful and responsive websites",
    icon: <Globe className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    prompt: "I want to learn CSS styling. Can you teach me the fundamentals of CSS?"
  },
  {
    title: "Learn JavaScript",
    description: "Add interactivity to your web pages",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-yellow-500 to-orange-500",
    prompt: "I want to learn JavaScript programming. Can you start with the basics?"
  },
  {
    title: "Learn Python",
    description: "Versatile programming for beginners",
    icon: <Code className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    prompt: "I want to learn Python programming. Can you guide me through the fundamentals?"
  },
  {
    title: "Learn MySQL",
    description: "Master database management",
    icon: <Database className="w-6 h-6" />,
    color: "from-purple-500 to-indigo-500",
    prompt: "I want to learn MySQL database. Can you teach me database concepts and SQL?"
  },
  {
    title: "Learn Java",
    description: "Object-oriented programming mastery",
    icon: <Code className="w-6 h-6" />,
    color: "from-red-500 to-pink-500",
    prompt: "I want to learn Java programming. Can you start with object-oriented concepts?"
  }
];

const conversationHistory = [
  { title: "HTML Basics Tutorial", time: "2 hours ago" },
  { title: "CSS Flexbox Guide", time: "Yesterday" },
  { title: "JavaScript Functions", time: "2 days ago" },
  { title: "Python Variables", time: "3 days ago" },
];

const AppSidebar = ({ onNewChat }: { onNewChat: () => void }) => {
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-semibold text-lg">Nurath.AI</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewChat} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Bot className="w-4 h-4" />
                  New Chat
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversationHistory.map((conversation, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton className="w-full justify-start">
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">{conversation.title}</span>
                      <span className="text-xs text-muted-foreground">{conversation.time}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const ChatContent = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Nurath.AI, your coding assistant. I'm here to help you learn programming. What would you like to learn today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    setShowSuggestions(false);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInputText("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: textToSend,
          conversationHistory: conversationHistory
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI service returned an error');
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        text: "Hello! I'm Nurath.AI, your coding assistant. I'm here to help you learn programming. What would you like to learn today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
    setShowSuggestions(true);
  };

  const handleTopicClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Chat with Nurath.AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your intelligent coding companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Learning Suggestions */}
        {showSuggestions && (
          <div className="p-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  What would you like to learn today?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Choose a topic below or ask me anything about programming
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningTopics.map((topic, index) => (
                  <Card 
                    key={index}
                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800 border-0 shadow-lg overflow-hidden"
                    onClick={() => handleTopicClick(topic.prompt)}
                  >
                    <div className={`h-2 bg-gradient-to-r ${topic.color}`} />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${topic.color} flex items-center justify-center text-white`}>
                          {topic.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors">
                            {topic.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
              >
                <div
                  className={`flex items-start gap-4 max-w-[80%] ${
                    message.isBot ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      message.isBot 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    }`}
                  >
                    {message.isBot ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <Card
                    className={`p-6 shadow-lg border-0 ${
                      message.isBot
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <span className={`text-xs mt-3 block ${
                      message.isBot ? 'text-gray-500 dark:text-gray-400' : 'text-purple-100'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </Card>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border-0">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about coding... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[80px] max-h-[200px] resize-none border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 rounded-2xl text-base shadow-lg"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-[80px] px-6 rounded-2xl shadow-lg"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onNewChat={() => {}} />
        <main className="flex-1">
          <ChatContent />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ChatInterface;
