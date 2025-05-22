
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Code,
  PanelLeft
} from "lucide-react";
import SkillLevelSelector from "@/components/SkillLevelSelector";
import LanguageSelector, { Language } from "@/components/LanguageSelector";
import Message from "@/components/Message";
import VoiceInput from "@/components/VoiceInput";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateAIResponse } from "@/utils/aiResponseHandler";
import NKTechLogo from "@/components/NKTechLogo";
import UserDropdown from "@/components/UserDropdown";
import ChatSidebar from "@/components/ChatSidebar";
import WelcomeScreen from "@/components/WelcomeScreen";

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
  avatarUrl?: string | null;
} | null;

const Index = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [language, setLanguage] = useState<Language>("en");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<UserType>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check URL parameters for conversation ID and also check if it's first visit
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId) {
      setConversationId(convId);
      fetchConversationMessages(convId);
    } else {
      // Add welcome message on first load if no conversation ID
      const firstVisit = localStorage.getItem('nurath_first_visit') !== 'false';
      
      if (firstVisit) {
        setShowWelcomeScreen(true);
        localStorage.setItem('nurath_first_visit', 'false');
      }
      
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
    }
  }, [language, searchParams]);

  // Check authentication status
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session?.user) {
        // Fetch user profile from the profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
        }
        
        setUser({
          id: data.session.user.id,
          name: profileData?.full_name || data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || "User",
          email: data.session.user.email || "",
          skillLevel: (profileData?.skill_level as SkillLevel) || skillLevel,
          language: (profileData?.language_preference as Language) || language,
          avatarUrl: profileData?.avatar_url
        });
        
        if (profileData?.skill_level) {
          setSkillLevel(profileData.skill_level as SkillLevel);
        }
        
        if (profileData?.language_preference) {
          setLanguage(profileData.language_preference as Language);
        }
      }
    };
    
    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        // Fetch user profile from the profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
        }
        
        setUser({
          id: session.user.id,
          name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
          email: session.user.email || "",
          skillLevel: (profileData?.skill_level as SkillLevel) || skillLevel,
          language: (profileData?.language_preference as Language) || language,
          avatarUrl: profileData?.avatar_url
        });
        
        if (profileData?.skill_level) {
          setSkillLevel(profileData.skill_level as SkillLevel);
        }
        
        if (profileData?.language_preference) {
          setLanguage(profileData.language_preference as Language);
        }
      } else {
        setUser(null);
      }
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch conversation messages
  const fetchConversationMessages = async (id: string) => {
    try {
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();
        
      if (conversationError) throw conversationError;
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      if (messagesData) {
        const formattedMessages: MessageType[] = messagesData.map(msg => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at || Date.now()),
          type: msg.type as "text" | "code" | "info" | "warning" | undefined
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      toast.error("Could not load conversation messages");
    }
  };

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
  const handleSkillLevelChange = async (level: SkillLevel) => {
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
      
      // Update the profile in the database
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ skill_level: level })
          .eq('id', session.user.id);
      }
    }
  };

  // Handle language change
  const handleLanguageChange = async (lang: Language) => {
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
      
      // Update the profile in the database
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ language_preference: lang })
          .eq('id', session.user.id);
      }
    }
  };

  // Handle voice input
  const handleVoiceInput = (text: string) => {
    setInputValue(text);
  };

  // Navigate to auth page
  const goToAuth = () => {
    navigate("/auth");
  };

  // Store message in the database
  const storeMessage = async (
    content: string, 
    role: "user" | "assistant", 
    type?: "text" | "code" | "info" | "warning",
    conversation_id?: string | null
  ) => {
    if (!session?.user?.id) return null;
    
    try {
      // If no conversation_id, create a new conversation first
      let conversationIdToUse = conversation_id;
      
      if (!conversationIdToUse) {
        // Create a title based on the first user message
        const title = content.length > 30 
          ? content.substring(0, 30) + "..." 
          : content;
          
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .insert([
            { 
              user_id: session.user.id,
              title
            }
          ])
          .select()
          .single();
          
        if (conversationError) throw conversationError;
        
        conversationIdToUse = conversationData.id;
        setConversationId(conversationData.id);
      }
      
      // Store the message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: session.user.id,
            content,
            role,
            type,
            conversation_id: conversationIdToUse
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error("Error storing message:", error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
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
    const userInput = inputValue; // Store input before clearing
    setInputValue("");
    
    // Store user message in database
    const storedMsgId = await storeMessage(userInput, "user", undefined, conversationId);
    if (storedMsgId) {
      userMessage.id = storedMsgId;
    }
    
    // Show AI is typing
    setIsTyping(true);
    
    // AI responds
    setTimeout(async () => {
      const aiResponse = generateAIResponse({
        prompt: userInput,
        skillLevel,
        language
      });
      
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        type: aiResponse.type
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Store AI message in database
      const storedAiMsgId = await storeMessage(
        aiResponse.content, 
        "assistant", 
        aiResponse.type, 
        conversationId
      );
      
      if (storedAiMsgId) {
        assistantMessage.id = storedAiMsgId;
      }
    }, 1000);
  };

  // Quick questions the user can ask
  const quickQuestions = [
    { 
      en: "What can you help me with?",
      sw: "Unaweza kunisaidia na nini?"
    },
    {
      en: "Teach me HTML basics",
      sw: "Nifundishe misingi ya HTML"
    },
    {
      en: "How do I create a website?",
      sw: "Nitatengenezaje tovuti?"
    },
    {
      en: "Show me a JavaScript example",
      sw: "Nionyeshe mfano wa JavaScript"
    }
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Welcome Screen */}
      {showWelcomeScreen && (
        <WelcomeScreen 
          onClose={() => setShowWelcomeScreen(false)} 
          onLanguageSelect={handleLanguageChange}
          currentLanguage={language}
        />
      )}
      
      {/* Sidebar */}
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-800 text-white">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <NKTechLogo size="md" className="text-white" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!isMobile && (
            <>
              <LanguageSelector 
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
              <SkillLevelSelector 
                currentLevel={skillLevel}
                onLevelChange={handleSkillLevelChange}
              />
            </>
          )}
          <ThemeToggle />
          {session ? (
            <UserDropdown 
              userName={user?.name || "User"}
              avatarUrl={user?.avatarUrl}
            />
          ) : (
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20" onClick={goToAuth}>
              Login
            </Button>
          )}
        </div>
      </header>

      {/* Mobile settings bar */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <LanguageSelector 
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
          <SkillLevelSelector 
            currentLevel={skillLevel}
            onLevelChange={handleSkillLevelChange}
          />
        </div>
      )}

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

      {/* Quick Questions */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground mb-2">
            {language === "en" ? "Try asking:" : "Jaribu kuuliza:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <Button 
                key={i} 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => {
                  setInputValue(language === "en" ? q.en : q.sw);
                  setTimeout(() => {
                    document.getElementById("chat-input")?.focus();
                  }, 100);
                }}
              >
                {language === "en" ? q.en : q.sw}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-muted/20">
        <div className="flex gap-2">
          <Input
            id="chat-input"
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
              <Code className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Examples</span>
            </Button>
          </div>
          <div className="hidden sm:block">
            {language === "en" ? "Nurath.AI answers tech questions in multiple languages!" : "Nurath.AI hujibu maswali ya teknolojia kwa lugha nyingi!"}
          </div>
        </div>
      </form>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
