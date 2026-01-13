import React, { useState, useRef, useCallback, useEffect } from "react";
import Message from "./Message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Send,
  Paperclip,
  Plus,
  X,
  ChevronDown,
  History,
  LogIn,
  LogOut,
  User,
  Globe,
  Trash2,
  Download,
  FileText,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
  Heart
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: any[];
  id: string;
  imageUrl?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: ConversationMessage[];
}

const MultimodalAI = () => {
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>(Date.now().toString());
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight;
      }, 100);
    }
  }, [conversation]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('nurath-chat-history');
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Save chat history
  const saveChatHistory = useCallback(() => {
    if (conversation.length > 0 && currentConversationId) {
      const existingIndex = chatHistory.findIndex(h => h.id === currentConversationId);
      const title = conversation[0]?.content?.substring(0, 30) || 'New Chat';
      
      const updatedHistory = existingIndex >= 0 
        ? chatHistory.map((h, i) => i === existingIndex ? { ...h, messages: conversation, title } : h)
        : [...chatHistory, { id: currentConversationId, title, date: new Date().toISOString(), messages: conversation }];
      
      setChatHistory(updatedHistory);
      localStorage.setItem('nurath-chat-history', JSON.stringify(updatedHistory.slice(-20)));
    }
  }, [conversation, currentConversationId, chatHistory]);

  useEffect(() => {
    saveChatHistory();
  }, [conversation, saveChatHistory]);

  // Auth state check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
        if (profileData?.language_preference) {
          setCurrentLanguage(profileData.language_preference);
        }
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setProfile(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const deleteChat = useCallback((chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = chatHistory.filter(h => h.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem('nurath-chat-history', JSON.stringify(updatedHistory));
    toast.success("Chat deleted");
  }, [chatHistory]);

  const clearAllHistory = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem('nurath-chat-history');
    toast.success("All history cleared");
  }, []);

  // Export conversation
  const exportConversation = useCallback((format: 'txt' | 'pdf') => {
    if (conversation.length === 0) {
      toast.error("No conversation to export");
      return;
    }

    const content = conversation.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.type === 'user' ? 'You' : 'Nurath AI';
      return `[${time}] ${sender}:\n${msg.content}\n`;
    }).join('\n---\n\n');

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nurath-chat-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Chat exported as TXT");
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Nurath AI Chat Export</title>
            <style>body{font-family:Arial,sans-serif;padding:20px}.message{margin-bottom:20px;padding:15px;border-radius:8px}.user{background:#e3f2fd}.ai{background:#f5f5f5}.time{color:#666;font-size:12px}.sender{font-weight:bold;margin-bottom:5px}</style>
            </head>
            <body><h1>Nurath AI Chat Export</h1><p>Exported on ${new Date().toLocaleString()}</p><hr>
              ${conversation.map(msg => `<div class="message ${msg.type}"><div class="time">${new Date(msg.timestamp).toLocaleString()}</div><div class="sender">${msg.type === 'user' ? 'You' : 'Nurath AI'}</div><div>${msg.content}</div></div>`).join('')}
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      toast.success("Print dialog opened for PDF");
    }
  }, [conversation]);

  // File upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles: any[] = [];
    
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      const reader = new FileReader();
      const fileData = await new Promise<any>((resolve) => {
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: file.type,
            data: e.target?.result,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
      
      newFiles.push(fileData);
    }
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) attached`);
  }, []);

  // Main AI interaction
  const handleAIInteraction = useCallback(async (input: string, attachments?: any[]) => {
    try {
      if (!input.trim() && !attachments?.length) {
        toast.error("Please enter a message");
        return;
      }

      setIsProcessing(true);

      const filesToSend = attachedFiles.length > 0 ? attachedFiles : attachments;

      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments: filesToSend,
        id: Date.now().toString()
      };

      setConversation(prev => [...prev, newMessage]);

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode: 'text',
          attachments: filesToSend,
          context: {
            userId: user?.id,
            language: currentLanguage,
            conversationHistory: conversation.slice(-5)
          }
        }
      });

      if (error) throw new Error(error.message);

      const aiMessage: ConversationMessage = {
        type: 'ai',
        content: data?.text || 'I had trouble processing your request.',
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
        imageUrl: data?.imageUrl
      };

      setConversation(prev => [...prev, aiMessage]);
      setAttachedFiles([]);

    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: error.message || "I'm having technical difficulties. Please try again.",
        timestamp: new Date(),
        id: (Date.now() + 2).toString()
      };
      setConversation(prev => [...prev, errorMessage]);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, user, attachedFiles, currentLanguage]);

  // Auth handlers
  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) throw error;
      setUser(data.user);
      setShowAuthDialog(false);
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: authName }
        }
      });
      if (error) throw error;
      toast.success("Check your email to verify your account!");
      setShowAuthDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success("Logged out");
  }, []);

  const startNewChat = useCallback(() => {
    setCurrentConversationId(Date.now().toString());
    setConversation([]);
    toast.success("New chat started");
  }, []);

  const loadChat = useCallback((chat: ChatHistory) => {
    setCurrentConversationId(chat.id);
    setConversation(chat.messages);
    setShowHistoryDialog(false);
    toast.success("Chat loaded");
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Full width, no container */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-xl font-semibold px-2">
              Nurath.AI
              <ChevronDown className="w-4 h-4 ml-1.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={startNewChat} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-3" />
              New Chat
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowHistoryDialog(true)} className="cursor-pointer">
              <History className="w-4 h-4 mr-3" />
              Chat History
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/telemed')} className="cursor-pointer text-sky-600">
              <Heart className="w-4 h-4 mr-3" />
              Telemed Health
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {user ? (
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setShowAuthDialog(true)} className="cursor-pointer">
                <LogIn className="w-4 h-4 mr-3" />
                Sign Up / Login
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ThemeToggle />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto flex flex-col" ref={chatContainerRef}>
        {conversation.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            {/* Centered title and input */}
            <div className="w-full max-w-2xl text-center mb-auto pt-16">
              <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {currentLanguage === 'sw' ? 'Nini ninaweza kukusaidia?' : 'What can I help you with?'}
              </h1>
            </div>
            
            {/* Quick actions at bottom */}
            <div className="w-full max-w-2xl mt-auto pb-4">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <button
                  onClick={() => handleAIInteraction("Tell me a fun fact")}
                  className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>💡</span> Fun Fact
                </button>
                <button
                  onClick={() => handleAIInteraction("Help me write something creative")}
                  className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>✍️</span> Creative Writing
                </button>
                <button
                  onClick={() => handleAIInteraction("Explain a complex topic simply")}
                  className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>🎓</span> Learn Something
                </button>
                <button
                  onClick={() => handleAIInteraction("Help me solve a problem")}
                  className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>🧩</span> Problem Solving
                </button>
                <button
                  onClick={() => handleAIInteraction("Give me coding help")}
                  className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>💻</span> Coding Help
                </button>
                <button
                  onClick={() => navigate('/telemed')}
                  className="px-4 py-2 text-sm rounded-full bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Telemed Health
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
            {conversation.map((msg) => (
              <Message 
                key={msg.id} 
                content={msg.content}
                type={msg.type}
                timestamp={msg.timestamp}
                imageUrl={msg.imageUrl}
              />
            ))}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - Full width, no container box */}
      <div className="px-4 py-3 border-t border-border/50 bg-background">
        <div className="max-w-3xl mx-auto">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-3 h-3" />
                  ) : (
                    <FileIcon className="w-3 h-3" />
                  )}
                  <span className="max-w-24 truncate text-xs">{file.name}</span>
                  <button
                    className="hover:text-destructive"
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <Textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentLanguage === 'sw' ? 'Andika ujumbe...' : 'Message Nurath AI...'}
              className="flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl bg-muted/30 border-muted"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim() || attachedFiles.length > 0) {
                    handleAIInteraction(inputText);
                    setInputText("");
                  }
                }
              }}
              disabled={isProcessing}
            />
            
            <Button
              onClick={() => {
                if (inputText.trim() || attachedFiles.length > 0) {
                  handleAIInteraction(inputText);
                  setInputText("");
                }
              }}
              disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing}
              size="icon"
              className="shrink-0 rounded-full"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.json"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        multiple
      />

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Nurath.AI</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={authName} 
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleSignup} className="w-full">
                Sign Up
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chat History</span>
              {chatHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No chat history yet</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-accent transition-colors group flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-muted-foreground text-sm">{new Date(chat.date).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultimodalAI;
