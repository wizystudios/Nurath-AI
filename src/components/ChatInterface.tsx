import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, Code, Database, Globe, Menu, X, Plus, MessageCircle, MoreVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import Logo from "@/components/Logo";
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
      text: "Hello! 👋 I'm Nurath.AI, your coding assistant created by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. I'm here to help you learn programming step by step! ✨ What would you like to explore today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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

    await saveMessage(textToSend, 'user');

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
      await saveMessage(data.response, 'assistant');
      
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
        text: "Hello! 👋 I'm Nurath.AI, your coding assistant created by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. I'm here to help you learn programming step by step! ✨ What would you like to explore today?",
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
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-purple-500/20 transform transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-80 translate-x-0' : 'w-16 translate-x-0'} lg:relative lg:translate-x-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Logo size="sm" showText={false} />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Nurath.AI
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0 hover:bg-purple-500/20 text-purple-300 hover:text-white transition-all duration-300"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Sidebar Content */}
        <div className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          {sidebarOpen && (
            <>
              {/* New Chat Button */}
              <Button 
                onClick={handleNewChat} 
                className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                ✨ New Chat
              </Button>

              {/* Recent Conversations */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-purple-300">📚 Chat History</h3>
                {Object.keys(groupedConversations).length > 0 ? (
                  Object.entries(groupedConversations).map(([dateGroup, convs]) => (
                    <div key={dateGroup} className="space-y-2">
                      <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wide flex items-center gap-2">
                        {dateGroup === "Today" ? "🌟" : dateGroup === "Yesterday" ? "⭐" : "📅"} {dateGroup}
                      </h4>
                      {convs.map((conversation) => (
                        <div key={conversation.id} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start text-left h-auto p-3 hover:bg-purple-500/20 text-gray-300 hover:text-white transition-all duration-300 rounded-xl"
                            onClick={() => handleConversationClick(conversation.id)}
                          >
                            <div className="flex items-start gap-3 w-full overflow-hidden">
                              <MessageCircle className="h-4 w-4 mt-1 flex-shrink-0 text-purple-400" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{conversation.title}</span>
                                <span className="text-xs text-purple-400">
                                  {formatDate(conversation.updated_at)}
                                </span>
                              </div>
                            </div>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-500/20 text-purple-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-purple-500/20">
                              <DropdownMenuItem
                                onClick={() => deleteConversation(conversation.id)}
                                className="text-red-400 focus:text-red-300 hover:bg-red-500/20"
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
                  <div className="text-center p-6 text-purple-400 text-sm">
                    💬 No chat history yet
                    <br />
                    <span className="text-xs text-purple-500">Start your first conversation!</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-purple-500/20">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all duration-300"
            >
              🏠 Back to Dashboard
            </Button>
          </div>
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
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-purple-500/20 text-purple-300 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <Logo size="sm" showText={false} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  ✨ Chat with Nurath.AI
                </h1>
                <p className="text-sm text-purple-400">Your magical coding companion 🚀</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Learning Suggestions */}
          {showSuggestions && (
            <div className="p-4 md:p-6 animate-fade-in overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 animate-scale-in">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-4 animate-pulse">
                    🌟 What magical skill would you like to learn today? ✨
                  </h2>
                  <p className="text-purple-300 text-base md:text-lg">
                    Choose a topic below or ask me anything about programming! 🚀
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {learningTopics.map((topic, index) => (
                    <Card 
                      key={index}
                      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-110 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-purple-500/20 shadow-xl overflow-hidden backdrop-blur-xl hover:border-purple-400/40 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleTopicClick(topic.prompt)}
                    >
                      <div className={`h-3 bg-gradient-to-r ${topic.gradient} animate-pulse`} />
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${topic.gradient} flex items-center justify-center text-white shadow-lg group-hover:animate-bounce`}>
                            {topic.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-purple-300 transition-colors text-white">
                              {topic.title}
                            </h3>
                            <p className="text-purple-400 text-sm">
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`flex items-start gap-4 max-w-[85%] md:max-w-[80%] ${
                      message.isBot ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
                        message.isBot 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      {message.isBot ? (
                        <Logo size="sm" showText={false} />
                      ) : (
                        <User className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </div>
                    <Card
                      className={`p-4 md:p-6 shadow-2xl border-0 backdrop-blur-xl ${
                        message.isBot
                          ? 'bg-gray-800/80 text-white border border-purple-500/20'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <span className={`text-xs mt-3 block ${
                        message.isBot ? 'text-purple-400' : 'text-purple-200'
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
                    <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
                      <Logo size="sm" showText={false} />
                    </div>
                    <Card className="p-4 md:p-6 bg-gray-800/80 shadow-2xl border border-purple-500/20 backdrop-blur-xl">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-purple-300 text-xs mt-2">✨ Nurath.AI is thinking...</p>
                    </Card>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 md:p-6 bg-gray-900/80 backdrop-blur-xl border-t border-purple-500/20">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="✨ Ask me anything about coding... (Press Enter to send, Shift+Enter for new line) 🚀"
                    className="min-h-[100px] md:min-h-[120px] max-h-[200px] resize-none border-2 border-purple-500/30 focus:border-purple-400 rounded-2xl text-sm md:text-base shadow-2xl bg-gray-800/50 backdrop-blur-xl text-white placeholder-purple-400"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-[100px] md:h-[120px] px-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  <Send className="h-6 w-6 md:h-7 md:w-7" />
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
