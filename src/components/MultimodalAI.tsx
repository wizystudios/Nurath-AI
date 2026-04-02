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
  Send, Paperclip, Plus, X, ChevronDown, History,
  LogIn, LogOut, Heart, Stethoscope, Building2, Pill,
  FlaskConical, File as FileIcon, Image as ImageIcon,
  Loader2, Trash2, MapPin, Phone, Calendar, Mail, User,
  MessageSquare, LayoutDashboard, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Doctor Card ───
const DoctorCard: React.FC<{ doctor: any; onBook: () => void; onChat: () => void }> = ({ doctor, onBook, onChat }) => {
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
            <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); onChat(); }}>
              <MessageSquare className="h-4 w-4 mr-2" /> Chat with Doctor
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

// ─── Organization Card ───
const OrgCard: React.FC<{ org: any; onViewDoctors?: (orgId: string) => void }> = ({ org, onViewDoctors }) => {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const navigate = useNavigate();

  const loadDetails = async () => {
    const [svcRes, docRes] = await Promise.all([
      supabase.from('org_services').select('*').eq('organization_id', org.id).eq('is_available', true),
      supabase.from('doctors').select('*').eq('organization_id', org.id).eq('is_approved', true),
    ]);
    setServices(svcRes.data || []);
    setDoctors(docRes.data || []);
  };

  return (
    <>
      <Card className="bg-muted/30 border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setOpen(true); loadDetails(); }}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{org.name}</p>
              {org.location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{org.location}</div>}
            </div>
            <Badge variant="outline" className="text-xs capitalize">{org.type?.replace('_', ' ')}</Badge>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{org.name}</SheetTitle>
            <Badge variant="outline" className="w-fit capitalize">{org.type?.replace('_', ' ')}</Badge>
          </SheetHeader>

          {org.ambulance_phone && (
            <a href={`tel:${org.ambulance_phone}`} className="block w-full mb-3">
              <Button className="w-full bg-destructive hover:bg-destructive/90">
                <Phone className="h-4 w-4 mr-2" /> Call Ambulance 24/7
              </Button>
            </a>
          )}

          <div className="space-y-2 text-sm">
            {org.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${org.phone}`}>{org.phone}</a></div>}
            {org.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{org.email}</div>}
            {org.description && <p className="text-muted-foreground py-2">{org.description}</p>}
          </div>

          {/* Doctors under this organization */}
          {doctors.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">Doctors ({doctors.length})</p>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {doctors.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{doc.full_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setOpen(false); navigate(`/telemed/book/${doc.id}`); }}>
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
                      </div>
                      {svc.price && <p className="text-sm font-semibold text-primary">Tsh {Number(svc.price).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {doctors.length === 0 && services.length === 0 && (
            <div className="mt-4 p-4 border border-dashed border-border rounded-lg text-center space-y-2">
              <p className="text-sm text-muted-foreground">No doctors or services listed yet.</p>
              <p className="text-xs text-muted-foreground">If you're the admin of this organization, go to your dashboard to add doctors and services.</p>
              <Button size="sm" variant="outline" onClick={() => { setOpen(false); navigate('/telemed/organization'); }}>
                Go to Admin Dashboard
              </Button>
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
  fileUrls?: string[];
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: ConversationMessage[];
}

const TELEMED_QUICK_ACTIONS = [
  { label: 'Find a Doctor', icon: Stethoscope, command: 'Find me a doctor' },
  { label: 'Hospitals', icon: Building2, command: 'Show me hospitals nearby' },
  { label: 'Pharmacies', icon: Pill, command: 'Find pharmacies to buy medicine' },
  { label: 'Lab Tests', icon: FlaskConical, command: 'Show lab testing facilities' },
  { label: "I'm not feeling well", icon: Heart, command: "I have a headache and fever, what should I do?" },
];

const GENERAL_QUICK_ACTIONS = [
  { label: '💡 Fun Fact', command: 'Tell me a fun fact' },
  { label: '✍️ Writing', command: 'Help me write something creative' },
  { label: '🎓 Learn', command: 'Explain a complex topic simply' },
  { label: '💻 Code', command: 'Give me coding help' },
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
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => { chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight; }, 100);
    }
  }, [conversation]);

  useEffect(() => {
    const saved = localStorage.getItem('nurath-chat-history');
    if (saved) { try { setChatHistory(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    if (conversation.length > 0 && currentConversationId) {
      setChatHistory(prev => {
        const existingIndex = prev.findIndex(h => h.id === currentConversationId);
        const title = conversation[0]?.content?.substring(0, 30) || 'New Chat';
        const updatedHistory = existingIndex >= 0
          ? prev.map((h, i) => i === existingIndex ? { ...h, messages: conversation, title } : h)
          : [...prev, { id: currentConversationId, title, date: new Date().toISOString(), messages: conversation }];
        localStorage.setItem('nurath-chat-history', JSON.stringify(updatedHistory.slice(-20)));
        return updatedHistory;
      });
    }
  }, [conversation, currentConversationId]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        if (data?.language_preference) setCurrentLanguage(data.language_preference);
      }
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (!session?.user) setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const deleteChat = useCallback((chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chatHistory.filter(h => h.id !== chatId);
    setChatHistory(updated);
    localStorage.setItem('nurath-chat-history', JSON.stringify(updated));
    toast.success("Chat deleted");
  }, [chatHistory]);

  const clearAllHistory = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem('nurath-chat-history');
    toast.success("All history cleared");
  }, []);

  // File upload — upload to Supabase Storage, get public URL
  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles: any[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} is too large (max 20MB)`); continue; }

      // Read as data URL for preview and AI processing
      const reader = new FileReader();
      const fileData = await new Promise<any>((resolve) => {
        reader.onload = (e) => {
          resolve({ name: file.name, type: file.type, data: e.target?.result, size: file.size, file });
        };
        reader.readAsDataURL(file);
      });

      // Upload to Supabase Storage if user is logged in
      if (user) {
        try {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from('chat-uploads').upload(filePath, file);
          if (!error) {
            const { data: urlData } = supabase.storage.from('chat-uploads').getPublicUrl(filePath);
            fileData.publicUrl = urlData.publicUrl;
          }
        } catch {}
      }

      newFiles.push(fileData);
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) attached`);
  }, [user]);

  // Telemed helpers
  const searchDoctors = async (query: string, location?: string) => {
    let q = supabase.from('doctors').select('*, organization:organizations(*)').eq('is_approved', true);
    const sanitized = query.replace(/[%_\\]/g, '').trim();
    if (sanitized) q = q.or(`full_name.ilike.%${sanitized}%,specialty.ilike.%${sanitized}%,location.ilike.%${sanitized}%`);
    if (location) {
      const sanitizedLoc = location.replace(/[%_\\]/g, '').trim();
      if (sanitizedLoc) q = q.ilike('location', `%${sanitizedLoc}%`);
    }
    const { data } = await q.limit(10);
    return data || [];
  };

  const getDoctorAvailability = async (doctorId: string) => {
    const targetDate = new Date().toISOString().split('T')[0];
    const { data: booked } = await supabase.from('appointments').select('appointment_time, status').eq('doctor_id', doctorId).eq('appointment_date', targetDate).in('status', ['pending', 'confirmed']);
    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const bookedTimes = (booked || []).map(s => s.appointment_time?.substring(0, 5));
    return { freeSlots: allSlots.filter(s => !bookedTimes.includes(s)), bookedTimes, date: targetDate };
  };

  const searchOrganizations = async (type: string, location?: string) => {
    let q = supabase.from('organizations').select('*').eq('is_approved', true).eq('is_suspended', false).eq('type', type as any);
    if (location) q = q.ilike('location', `%${location}%`);
    const { data } = await q.limit(10);
    return data || [];
  };

  // Start chat with doctor — navigate directly to chat tab with chatId
  const startChatWithDoctor = async (doctor: any) => {
    if (!user) { toast.error("Please log in to chat with a doctor"); navigate('/auth'); return; }
    try {
      // Check if chat already exists
      const { data: existing } = await supabase.from('telemed_chats').select('id').eq('doctor_id', doctor.id).eq('patient_id', user.id).maybeSingle();
      if (existing) {
        navigate(`/telemed/patient?tab=chats&chatId=${existing.id}`);
        return;
      }
      // Create new chat
      const { data: newChat, error } = await supabase.from('telemed_chats').insert({
        doctor_id: doctor.id,
        patient_id: user.id,
        patient_name: profile?.full_name || user.email?.split('@')[0] || 'Patient',
        status: 'active',
      }).select('id').single();
      if (error) throw error;
      toast.success(`Chat started with Dr. ${doctor.full_name}!`);
      navigate(`/telemed/patient?tab=chats&chatId=${newChat.id}`);
    } catch { toast.error("Failed to start chat"); }
  };

  // Main AI interaction
  const handleAIInteraction = useCallback(async (input: string, attachments?: any[]) => {
    try {
      if (!input.trim() && !attachedFiles.length && !attachments?.length) { toast.error("Please enter a message"); return; }

      setIsProcessing(true);
      const filesToSend = attachedFiles.length > 0 ? attachedFiles : attachments;

      const newMessage: ConversationMessage = {
        type: 'user', content: input, timestamp: new Date(),
        attachments: filesToSend, id: Date.now().toString(),
        fileUrls: filesToSend?.map((f: any) => f.publicUrl).filter(Boolean),
      };
      setConversation(prev => [...prev, newMessage]);

      let telemedData: any = null;
      let telemedType: 'doctors' | 'hospitals' | undefined;

      if (isTelemedMode) {
        const lowerInput = input.toLowerCase();
        const locationMatch = input.match(/(?:in|near|at|around|karibu na)\s+([A-Za-z\s]+?)(?:\s*$|[,.])/i);
        const locationFilter = locationMatch ? locationMatch[1].trim() : undefined;

        // Symptom keywords that should trigger doctor suggestions
        const symptomKeywords = ['pain', 'ache', 'fever', 'cough', 'sick', 'feeling', 'hurt', 'headache', 'stomach', 'chest', 
          'dizzy', 'nausea', 'vomit', 'diarrhea', 'rash', 'allergy', 'breathing', 'fatigue', 'tired', 'swelling',
          'maumivu', 'homa', 'kikohozi', 'kichwa', 'tumbo', 'kizunguzungu', 'kutapika', 'uchovu',
          'symptoms', 'not feeling well', 'unwell', 'ill', 'sickness', 'diagnosis', 'condition'];
        const hasSymptoms = symptomKeywords.some(k => lowerInput.includes(k));

        if (lowerInput.includes('doctor') || lowerInput.includes('specialist') || lowerInput.includes('daktari') || lowerInput.includes('available') || hasSymptoms) {
          const query = input.replace(/find|me|a|show|doctor|doctors|specialist|in|near|at|around|karibu\s+na|available|free\s+time|when|book|i have|i feel|i'm|my/gi, '').replace(locationFilter || '', '').replace(/[,.\-!?;:'"()]/g, ' ').replace(/\s+/g, ' ').trim() || '';
          const doctors = await searchDoctors(query, locationFilter);
          if (doctors.length > 0) {
            telemedData = doctors;
            telemedType = 'doctors';
            const availInfo: string[] = [];
            for (const doc of doctors.slice(0, 3)) {
              const avail = await getDoctorAvailability(doc.id);
              availInfo.push(avail.freeSlots.length > 0
                ? `Dr. ${doc.full_name} (${doc.specialty}) has free slots today: ${avail.freeSlots.slice(0, 5).join(', ')}.`
                : `Dr. ${doc.full_name} is fully booked today.`);
            }
            if (hasSymptoms) {
              input = input + '\n\n[SYSTEM: The user described symptoms. First, briefly assess what type of specialist they might need based on their symptoms. Then show the matching doctors found with their availability. Recommend booking. Do NOT give a medical diagnosis — suggest consulting a doctor. Be empathetic and helpful.]\n' + availInfo.join('\n');
            } else {
              input = input + '\n\n[SYSTEM: Here are the doctors found. Present them directly to the user with their availability. Do NOT ask follow-up questions — just show the results.]\n' + availInfo.join('\n');
            }
          } else if (hasSymptoms) {
            // No doctors found but user has symptoms — still provide health guidance
            input = input + '\n\n[SYSTEM: No specific doctors were found matching the symptoms. Provide general health advice for the described symptoms and suggest the user search for a specific type of specialist. Be empathetic. Mention they can search for hospitals or clinics too.]';
          }
        } else if (lowerInput.includes('hospital') || lowerInput.includes('hospitali')) {
          telemedData = await searchOrganizations('hospital', locationFilter);
          telemedType = 'hospitals';
        } else if (lowerInput.includes('pharmacy') || lowerInput.includes('duka') || lowerInput.includes('medicine') || lowerInput.includes('dawa')) {
          telemedData = await searchOrganizations('pharmacy', locationFilter);
          telemedType = 'hospitals';
        } else if (lowerInput.includes('lab') || lowerInput.includes('test') || lowerInput.includes('maabara')) {
          telemedData = await searchOrganizations('lab', locationFilter);
          telemedType = 'hospitals';
        } else if (lowerInput.includes('clinic') || lowerInput.includes('kliniki')) {
          telemedData = await searchOrganizations('clinic', locationFilter);
          telemedType = 'hospitals';
        } else if (lowerInput.includes('health center') || lowerInput.includes('kituo cha afya')) {
          telemedData = await searchOrganizations('health_center', locationFilter);
          telemedType = 'hospitals';
        }
      }

      // Determine mode
      let mode = isTelemedMode ? 'telemed' : 'text';
      if (filesToSend?.length) {
        const firstFile = filesToSend[0];
        if (firstFile.type?.startsWith('image/')) mode = 'image';
        else mode = 'document';
      }

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input: input || (filesToSend?.length ? `Analyze this ${filesToSend[0]?.type?.startsWith('image/') ? 'image' : 'file'}: ${filesToSend[0]?.name}` : ''),
          mode,
          attachments: filesToSend,
          context: { userId: user?.id, language: currentLanguage, conversationHistory: conversation.slice(-5) },
          userEmail: user?.email,
          userProfile: profile,
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
      setConversation(prev => [...prev, {
        type: 'ai', content: error.message || "I'm having technical difficulties. Please try again.",
        timestamp: new Date(), id: (Date.now() + 2).toString()
      }]);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, user, attachedFiles, currentLanguage, isTelemedMode, profile]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    toast.success("Logged out");
  }, []);

  const startNewChat = useCallback(() => {
    setCurrentConversationId(Date.now().toString());
    setConversation([]); toast.success("New chat started");
  }, []);

  const loadChat = useCallback((chat: ChatHistory) => {
    setCurrentConversationId(chat.id);
    setConversation(chat.messages);
    setShowHistoryDialog(false);
  }, []);

  const renderTelemedCards = (msg: ConversationMessage) => {
    if (!msg.telemedData || msg.telemedData.length === 0) return null;
    if (msg.telemedType === 'doctors') {
      return (
        <div className="space-y-2 mt-3">
          <p className="text-sm text-muted-foreground">{msg.telemedData.length} doctor{msg.telemedData.length !== 1 ? 's' : ''} found:</p>
          {msg.telemedData.map((doctor: any) => (
            <DoctorCard key={doctor.id} doctor={doctor}
              onBook={() => navigate(`/telemed/book/${doctor.id}`)}
              onChat={() => startChatWithDoctor(doctor)}
            />
          ))}
        </div>
      );
    }
    if (msg.telemedType === 'hospitals') {
      return (
        <div className="space-y-2 mt-3">
          <p className="text-sm text-muted-foreground">{msg.telemedData.length} result{msg.telemedData.length !== 1 ? 's' : ''} found:</p>
          {msg.telemedData.map((org: any) => <OrgCard key={org.id} org={org} />)}
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
              <Plus className="w-4 h-4 mr-3" /> New Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHistoryDialog(true)} className="cursor-pointer">
              <History className="w-4 h-4 mr-3" /> Chat History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isTelemedMode ? (
              <>
                <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-3" /> General AI
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem onClick={() => navigate('/telemed/patient')} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-3" /> My Health Dashboard
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <DropdownMenuItem onClick={() => navigate('/?mode=telemed')} className="cursor-pointer text-primary">
                <Heart className="w-4 h-4 mr-3" /> Telemed Health
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-3" /> Logout ({user.email?.split('@')[0]})
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                <LogIn className="w-4 h-4 mr-3" /> Sign Up / Login
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
                    <button key={i} onClick={() => handleAIInteraction(action.command)}
                      className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2">
                      <action.icon className="w-4 h-4" /> {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    {GENERAL_QUICK_ACTIONS.map((action, i) => (
                      <button key={i} onClick={() => handleAIInteraction(action.command)}
                        className="px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors">
                        {action.label}
                      </button>
                    ))}
                    <button onClick={() => navigate('/?mode=telemed')}
                      className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2">
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
                {/* Show attached file thumbnails for user messages */}
                {msg.type === 'user' && msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 justify-end">
                    {msg.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg text-xs">
                        {file.type?.startsWith('image/') ? (
                          <img src={file.data || file.publicUrl} alt={file.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <><FileIcon className="w-3 h-3" /><span className="truncate max-w-20">{file.name}</span></>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Message content={msg.content} type={msg.type} timestamp={msg.timestamp} imageUrl={msg.imageUrl} />
                {msg.type === 'ai' && renderTelemedCards(msg)}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-start mb-4">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
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
                  {file.type?.startsWith('image/') ? (
                    <img src={file.data} alt={file.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <FileIcon className="w-3 h-3" />
                  )}
                  <span className="max-w-24 truncate text-xs">{file.name}</span>
                  <button className="hover:text-destructive" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              <Paperclip className="w-5 h-5" />
            </Button>
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
                  if (inputText.trim() || attachedFiles.length > 0) { handleAIInteraction(inputText); setInputText(""); }
                }
              }}
              disabled={isProcessing}
            />
            <Button
              onClick={() => { if (inputText.trim() || attachedFiles.length > 0) { handleAIInteraction(inputText); setInputText(""); } }}
              disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing}
              size="icon" className="shrink-0 rounded-full"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input — accepts all common types */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.pptx"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        multiple
      />

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chat History</span>
              {chatHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No chat history yet</p>
            ) : (
              chatHistory.map((chat) => (
                <div key={chat.id} onClick={() => loadChat(chat)}
                  className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-accent transition-colors group flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-muted-foreground text-sm">{new Date(chat.date).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity">
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
