import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, Code, Database, Globe, Menu, X, Plus, MessageCircle, MoreVertical, Trash2, ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import Logo from "@/components/Logo";
import MessageRenderer from "@/components/MessageRenderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const learningTopics = [
  {
    title: "Learn HTML 🌐",
    description: "Master the foundation of web development",
    icon: <Code className="w-6 h-6" />,
    gradient: "from-orange-400 via-red-500 to-pink-500",
    prompt: "I want to learn HTML from basics. Can you start with a beginner-friendly introduction and teach me step by step?"
  },
  {
    title: "Learn CSS ✨",
    description: "Style beautiful and responsive websites",
    icon: <Globe className="w-6 h-6" />,
    gradient: "from-blue-400 via-purple-500 to-indigo-600",
    prompt: "I want to learn CSS styling. Can you teach me the fundamentals of CSS with practical examples?"
  },
  {
    title: "Learn JavaScript ⚡",
    description: "Add interactivity to your web pages",
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-yellow-400 via-orange-500 to-red-500",
    prompt: "I want to learn JavaScript programming. Can you start with the basics and show me interactive examples?"
  },
  {
    title: "Learn Python 🐍",
    description: "Versatile programming for beginners",
    icon: <Code className="w-6 h-6" />,
    gradient: "from-green-400 via-emerald-500 to-teal-600",
    prompt: "I want to learn Python programming. Can you guide me through the fundamentals with practical exercises?"
  },
  {
    title: "Learn MySQL 🗄️",
    description: "Master database management",
    icon: <Database className="w-6 h-6" />,
    gradient: "from-purple-400 via-indigo-500 to-blue-600",
    prompt: "I want to learn MySQL database. Can you teach me database concepts and SQL with real examples?"
  },
  {
    title: "Learn Java ☕",
    description: "Object-oriented programming mastery",
    icon: <Code className="w-6 h-6" />,
    gradient: "from-red-400 via-pink-500 to-purple-600",
    prompt: "I want to learn Java programming. Can you start with object-oriented concepts and provide hands-on examples?"
  }
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! 👋 I'm **Nurath.AI**, your coding assistant created by **KN Technology** in Tanzania, co-founded by CEO **Khalifa Nadhiru**. I'm here to help you learn programming step by step! ✨ What would you like to explore today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start collapsed on mobile
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [guestPromptCount, setGuestPromptCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkUser();
    loadConversations();
    
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      loadConversation(conversationId);
    }

    // Set sidebar closed by default on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.content,
          isBot: msg.role === 'assistant',
          timestamp: new Date(msg.created_at || '')
        }));
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error("Failed to load conversation");
    }
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant', conversationId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      let finalConversationId = conversationId || currentConversationId;

      if (!finalConversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: session.user.id,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          })
          .select()
          .single();

        if (convError) throw convError;
        finalConversationId = newConversation.id;
        setCurrentConversationId(finalConversationId);
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: session.user.id,
          conversation_id: finalConversationId,
          content,
          role
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', finalConversationId);

      loadConversations();
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id);

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success("Conversation deleted! 🗑️");
      loadConversations();

      if (currentConversationId === conversationId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    // Check if user is a guest and has reached limit
    if (!user) {
      if (guestPromptCount >= 3) {
        toast.error("You've reached the 3 free prompts limit! Please sign up to continue chatting.");
        navigate("/auth");
        return;
      }
      setGuestPromptCount(prev => prev + 1);
    }

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

    if (user) {
      await saveMessage(textToSend, 'user');
    }

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
      if (user) {
        await saveMessage(data.response, 'assistant');
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment. 😅",
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
        text: "Hello! 👋 I'm **Nurath.AI**, your coding assistant created by **KN Technology** in Tanzania, co-founded by CEO **Khalifa Nadhiru**. I'm here to help you learn programming step by step! ✨ What would you like to explore today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
    setShowSuggestions(true);
    setCurrentConversationId(null);
    window.history.pushState({}, '', '/chat');
  };

  const handleTopicClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleConversationClick = (conversationId: string) => {
    window.history.pushState({}, '', `/chat?conversation=${conversationId}`);
    loadConversation(conversationId);
    setSidebarOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    }
    
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "MMM d");
    }
    
    return format(date, "MMM d, yyyy");
  };

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {};
    
    conversations.forEach(conv => {
      const date = new Date(conv.created_at);
      const now = new Date();
      let groupKey;
      
      if (date.toDateString() === now.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = format(date, "MMMM d, yyyy");
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conv);
    });
    
    return groups;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/3 dark:bg-purple-500/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/3 dark:bg-pink-500/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} lg:relative lg:translate-x-0 lg:${sidebarOpen ? 'w-64' : 'w-0'}`}>
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <Logo size="sm" showText={false} />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Nurath.AI
                </span>
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* New Chat Button */}
              <Button 
                onClick={handleNewChat} 
                className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                ✨ New Chat
              </Button>

              {/* Guest prompt counter */}
              {!user && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600/30 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                    🎯 Free prompts: {guestPromptCount}/3
                  </p>
                  {guestPromptCount >= 2 && (
                    <p className="text-yellow-600 dark:text-yellow-300 text-xs mt-1">
                      Sign up for unlimited chat!
                    </p>
                  )}
                </div>
              )}

              {/* Recent Conversations */}
              {user && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">📚 Chat History</h3>
                  {Object.keys(groupedConversations).length > 0 ? (
                    Object.entries(groupedConversations).map(([dateGroup, convs]) => (
                      <div key={dateGroup} className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          {dateGroup === "Today" ? "🌟" : dateGroup === "Yesterday" ? "⭐" : "📅"} {dateGroup}
                        </h4>
                        {convs.map((conversation) => (
                          <div key={conversation.id} className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start text-left h-auto p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg"
                              onClick={() => handleConversationClick(conversation.id)}
                            >
                              <div className="flex items-start gap-3 w-full overflow-hidden">
                                <MessageCircle className="h-4 w-4 mt-1 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium truncate">{conversation.title}</span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatDate(conversation.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <DropdownMenuItem
                                  onClick={() => deleteConversation(conversation.id)}
                                  className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  🗑️ Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-gray-400 dark:text-gray-500 text-sm">
                      💬 No chat history yet
                      <br />
                      <span className="text-xs text-gray-500 dark:text-gray-600">Start your first conversation!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
              {!user ? (
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  🚀 Sign Up / Login
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  🏠 Dashboard
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Logo size="sm" showText={false} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ✨ Nurath.AI
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your AI coding companion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Learning Suggestions */}
          {showSuggestions && (
            <div className="p-4 md:p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    🌟 What would you like to learn today? ✨
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                    Choose a topic below or ask me anything about programming! 🚀
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {learningTopics.map((topic, index) => (
                    <Card 
                      key={index}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500/50"
                      onClick={() => handleTopicClick(topic.prompt)}
                    >
                      <div className={`h-2 bg-gradient-to-r ${topic.gradient}`} />
                      <div className="p-3 md:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r ${topic.gradient} flex items-center justify-center text-white`}>
                            {topic.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-gray-900 dark:text-white">
                              {topic.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
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
          <div className="flex-1 overflow-y-auto p-3 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`flex items-start gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] ${
                      message.isBot ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full ${
                        message.isBot 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      {message.isBot ? (
                        <Logo size="sm" showText={false} />
                      ) : (
                        <User className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 md:p-4 text-sm md:text-base leading-relaxed ${
                        message.isBot
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      }`}
                    >
                      <MessageRenderer content={message.text} />
                      <span className={`text-xs mt-2 block ${
                        message.isBot ? 'text-gray-400 dark:text-gray-500' : 'text-purple-200'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Logo size="sm" showText={false} />
                    </div>
                    <div className="p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">✨ Nurath.AI is thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 md:gap-3 items-end">
                <div className="flex-1">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="✨ Ask me anything about coding... (Press Enter to send) 🚀"
                    className="min-h-[60px] md:min-h-[80px] max-h-[150px] resize-none border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl text-sm md:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-[60px] md:h-[80px] px-3 md:px-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
