import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Heart,
  Stethoscope,
  Building2,
  Pill,
  FlaskConical,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
  Trash2,
  MapPin,
  Phone,
  Calendar,
  Mail,
  User,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Clickable Doctor Card with bottom-sheet detail ───────────────────────────
const DoctorCard: React.FC<{ doctor: any; onBook: () => void }> = ({ doctor, onBook }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card className="bg-muted/30 border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpen(true)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{doctor.full_name}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
              {doctor.organization?.name && <p className="text-xs text-muted-foreground">{doctor.organization.name}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {doctor.consultation_fee && <p className="text-xs font-semibold text-primary">Tsh {Number(doctor.consultation_fee).toLocaleString()}</p>}
              <Badge variant={doctor.is_online ? 'default' : 'secondary'} className="text-xs mt-1">{doctor.is_online ? 'Online' : 'Offline'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-4 pb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
            <div>
              <SheetTitle>Dr. {doctor.full_name}</SheetTitle>
              <p className="text-muted-foreground text-sm">{doctor.specialty}</p>
            </div>
          </SheetHeader>
          <div className="space-y-3 py-2">
            {doctor.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{doctor.phone}</div>}
            {doctor.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{doctor.email}</div>}
            {doctor.location && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{doctor.location}</div>}
            {doctor.experience_years && <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" />Experience: {doctor.experience_years} years</div>}
            {doctor.consultation_fee && <div className="flex items-center gap-2 text-sm font-medium"><span className="text-muted-foreground">Fee:</span> Tsh {Number(doctor.consultation_fee).toLocaleString()}</div>}
            {doctor.bio && <div className="mt-3"><p className="text-sm font-medium mb-1">About</p><p className="text-sm text-muted-foreground">{doctor.bio}</p></div>}
            {doctor.organization?.name && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" />{doctor.organization.name}</div>}
          </div>
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={() => { setOpen(false); onBook(); }}>
              <Calendar className="h-4 w-4 mr-2" /> Book Appointment
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

// ─── Clickable Organization Card with bottom-sheet detail ────────────────────
const OrgCard: React.FC<{ org: any }> = ({ org }) => {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const loadServices = async () => {
    const { data } = await supabase.from('org_services').select('*').eq('organization_id', org.id).eq('is_available', true);
    setServices(data || []);
  };
  return (
    <>
      <Card className="bg-muted/30 border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setOpen(true); loadServices(); }}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{org.name}</p>
              {org.location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{org.location}</div>}
            </div>
            <Badge variant="outline" className="text-xs capitalize">{org.type}</Badge>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{org.name}</SheetTitle>
            <Badge variant="outline" className="w-fit capitalize">{org.type?.replace('_', ' ')}</Badge>
          </SheetHeader>
          {org.phone && (
            <a href={`tel:${org.phone}`} className="block w-full mb-3">
              {org.type === 'hospital' && org.ambulance_phone ? (
                <Button className="w-full bg-destructive hover:bg-destructive/90">
                  <Phone className="h-4 w-4 mr-2" /> Call Ambulance 24/7
                </Button>
              ) : null}
            </a>
          )}
          <div className="space-y-2 text-sm">
            {org.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{org.phone}</div>}
            {org.ambulance_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-destructive" /> Ambulance: {org.ambulance_phone}</div>}
            {org.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{org.email}</div>}
            {org.description && <p className="text-muted-foreground py-2">{org.description}</p>}
          </div>
          {services.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">Services ({services.length})</p>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {services.map((svc: any) => (
                    <div key={svc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        {svc.category && <p className="text-xs text-muted-foreground capitalize">{svc.category}</p>}
                        {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                      </div>
                      {svc.price && <p className="text-sm font-semibold text-primary">Tsh {Number(svc.price).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: any[];
  id: string;
  imageUrl?: string;
  telemedData?: any;
  telemedType?: 'doctors' | 'hospitals';
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: ConversationMessage[];
}

const TELEMED_QUICK_ACTIONS = [
  { label: 'Find a Doctor', icon: Stethoscope, command: 'Find me a doctor' },
  { label: 'Hospitals', icon: Building2, command: 'Show me nearby hospitals' },
  { label: 'Pharmacies', icon: Pill, command: 'Find pharmacies' },
  { label: 'Lab Tests', icon: FlaskConical, command: 'Show lab testing facilities' },
  { label: 'Health Tips', icon: Heart, command: 'Give me some health tips' },
];

const GENERAL_QUICK_ACTIONS = [
  { label: '💡 Fun Fact', command: 'Tell me a fun fact' },
  { label: '✍️ Creative Writing', command: 'Help me write something creative' },
  { label: '🎓 Learn Something', command: 'Explain a complex topic simply' },
  { label: '🧩 Problem Solving', command: 'Help me solve a problem' },
  { label: '💻 Coding Help', command: 'Give me coding help' },
];

const MultimodalAI = () => {
  const [searchParams] = useSearchParams();
  const isTelemedMode = searchParams.get('mode') === 'telemed';
  
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

  // Telemed database search helpers
  const searchDoctors = async (query: string) => {
    const { data } = await supabase
      .from('doctors')
      .select('*, organization:organizations(*)')
      .eq('is_approved', true)
      .or(`full_name.ilike.%${query}%,specialty.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(5);
    return data || [];
  };

  const searchOrganizations = async (type: string, query?: string) => {
    let queryBuilder = supabase
      .from('organizations')
      .select('*')
      .eq('is_approved', true)
      .eq('is_suspended', false)
      .eq('type', type as any);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,location.ilike.%${query}%`);
    }

    const { data } = await queryBuilder.limit(5);
    return data || [];
  };

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

      // In telemed mode, also search the database for relevant results
      let telemedData: any = null;
      let telemedType: 'doctors' | 'hospitals' | undefined;
      
      if (isTelemedMode) {
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('doctor') || lowerInput.includes('specialist') || lowerInput.includes('daktari')) {
          const query = input.replace(/find|me|a|show|doctor|doctors|specialist/gi, '').trim() || '';
          const doctors = await searchDoctors(query);
          if (doctors.length > 0) {
            telemedData = doctors;
            telemedType = 'doctors';
          }
        } else if (lowerInput.includes('hospital') || lowerInput.includes('hospitali')) {
          const hospitals = await searchOrganizations('hospital');
          if (hospitals.length > 0) {
            telemedData = hospitals;
            telemedType = 'hospitals';
          }
        } else if (lowerInput.includes('pharmacy') || lowerInput.includes('duka') || lowerInput.includes('medicine')) {
          const pharmacies = await searchOrganizations('pharmacy');
          if (pharmacies.length > 0) {
            telemedData = pharmacies;
            telemedType = 'hospitals';
          }
        } else if (lowerInput.includes('lab') || lowerInput.includes('test') || lowerInput.includes('maabara')) {
          const labs = await searchOrganizations('lab');
          if (labs.length > 0) {
            telemedData = labs;
            telemedType = 'hospitals';
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode: isTelemedMode ? 'telemed' : 'text',
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
        imageUrl: data?.imageUrl,
        telemedData,
        telemedType,
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
  }, [conversation, user, attachedFiles, currentLanguage, isTelemedMode]);

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

  // Render telemed data cards inline — clickable with detail sheet
  const renderTelemedCards = (msg: ConversationMessage) => {
    if (!msg.telemedData) return null;

    if (msg.telemedType === 'doctors') {
      return (
        <div className="space-y-2 mt-3">
          <p className="text-sm text-muted-foreground">
            {msg.telemedData.length} doctor{msg.telemedData.length !== 1 ? 's' : ''} found. Tap a card for details:
          </p>
          {msg.telemedData.map((doctor: any) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={() => navigate(`/telemed/book/${doctor.id}`)} />
          ))}
        </div>
      );
    }

    if (msg.telemedType === 'hospitals') {
      return (
        <div className="space-y-2 mt-3">
          <p className="text-sm text-muted-foreground">
            {msg.telemedData.length} result{msg.telemedData.length !== 1 ? 's' : ''} found. Tap for details:
          </p>
          {msg.telemedData.map((org: any) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      );
    }

    return null;
  };

  const quickActions = isTelemedMode ? TELEMED_QUICK_ACTIONS : GENERAL_QUICK_ACTIONS;
  const headerTitle = isTelemedMode ? 'Nurath.AI Health' : 'Nurath.AI';
  const placeholder = isTelemedMode 
    ? (currentLanguage === 'sw' ? 'Uliza swali la afya...' : 'Ask a health question...')
    : (currentLanguage === 'sw' ? 'Andika ujumbe...' : 'Message Nurath AI...');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-xl font-semibold px-2">
              {headerTitle}
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

            {isTelemedMode ? (
              <>
              <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-3" />
                  General AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/telemed/auth')} className="cursor-pointer">
                  <LogIn className="w-4 h-4 mr-3" />
                  Healthcare Login
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem onClick={() => navigate('/telemed/patient')} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-3" />
                    My Health Dashboard
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <DropdownMenuItem onClick={() => navigate('/?mode=telemed')} className="cursor-pointer text-primary">
                <Heart className="w-4 h-4 mr-3" />
                Telemed Health
              </DropdownMenuItem>
            )}
            
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
            <div className="w-full max-w-2xl text-center mb-auto pt-16">
              <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {isTelemedMode
                  ? (currentLanguage === 'sw' ? 'Ninaweza kukusaidiaje na afya yako?' : 'How can I help with your health?')
                  : (currentLanguage === 'sw' ? 'Nini ninaweza kukusaidia?' : 'What can I help you with?')
                }
              </h1>
              {isTelemedMode && (
                <p className="text-muted-foreground mb-4">Find doctors, hospitals, pharmacies, and get health advice</p>
              )}
            </div>
            
            <div className="w-full max-w-2xl mt-auto pb-4">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {isTelemedMode ? (
                  TELEMED_QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleAIInteraction(action.command)}
                      className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    {GENERAL_QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAIInteraction(action.command)}
                        className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => navigate('/?mode=telemed')}
                      className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" /> Telemed Health
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
            {conversation.map((msg) => (
              <div key={msg.id}>
                <Message 
                  content={msg.content}
                  type={msg.type}
                  timestamp={msg.timestamp}
                  imageUrl={msg.imageUrl}
                />
                {msg.type === 'ai' && renderTelemedCards(msg)}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isTelemedMode ? 'Searching & thinking...' : 'Thinking...'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border/50 bg-background">
        <div className="max-w-3xl mx-auto">
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
            {!isTelemedMode && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            )}
            
            <Textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholder}
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
                <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              </div>
              <Button onClick={handleLogin} className="w-full">Login</Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={authName} onChange={(e) => setAuthName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              </div>
              <Button onClick={handleSignup} className="w-full">Sign Up</Button>
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
                <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-destructive hover:text-destructive">
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
