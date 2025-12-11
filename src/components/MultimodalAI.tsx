import React, { useState, useRef, useCallback, useEffect } from "react";
import Message from "./Message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Volume2,
  Send,
  Paperclip,
  Music,
  Clock,
  Eye,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  StopCircle,
  Plus,
  Settings,
  X,
  ChevronDown,
  FileText,
  File as FileIcon,
  History,
  LogIn,
  LogOut,
  User,
  Globe
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
  hasAudio?: boolean;
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  downloadUrl?: string;
  fileData?: {
    type: string;
    content: string;
    metadata?: any;
  };
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: ConversationMessage[];
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<'text' | 'voice' | 'video'>('text');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  const aiAvatarImages = {
    default: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&h=400",
    speaking: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&h=400",
    listening: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&h=400"
  };

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

  // Save chat history to localStorage
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
  }, [conversation]);

  // Enhanced voice recognition
  const setupVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice recognition not supported - please try Chrome or Edge browser");
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLanguage === 'sw' ? 'sw-KE' : 'en-US';
    recognition.maxAlternatives = 3;
    
    return recognition;
  }, [currentLanguage]);

  // Text-to-speech
  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = currentLanguage === 'sw' ? 'sw-KE' : 'en-US';
        
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.startsWith(currentLanguage === 'sw' ? 'sw' : 'en') &&
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  }, [currentLanguage]);

  // File analysis
  const analyzeFile = useCallback(async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: file.type,
          data: e.target?.result as string,
          name: file.name,
          size: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Main AI interaction
  const handleAIInteraction = useCallback(async (
    input: string, 
    mode: string = 'text', 
    attachments?: any[],
    forceSpeak: boolean = false
  ) => {
    try {
      if (!input.trim() && !attachments?.length) {
        toast.error("Please provide some input");
        return;
      }

      setIsProcessing(true);

      // Include attached files in the message
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
          mode,
          attachments: filesToSend,
          videoEnabled: isVideoOn,
          shouldSpeak: forceSpeak || mode === 'voice' || mode === 'video',
          context: {
            currentMode,
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
        hasAudio: !!data?.audioUrl,
        id: (Date.now() + 1).toString(),
        imageUrl: data?.imageUrl
      };

      setConversation(prev => [...prev, aiMessage]);

      // Clear attached files after sending
      setAttachedFiles([]);

      // Speak response if needed
      if (forceSpeak || mode === 'voice' || mode === 'video') {
        await speakText(data?.text || '');
      }

    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: error.message || "I'm having technical difficulties.",
        timestamp: new Date(),
        id: (Date.now() + 2).toString()
      };
      setConversation(prev => [...prev, errorMessage]);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [currentMode, isVideoOn, conversation, user, attachedFiles, speakText, currentLanguage]);

  // Voice recognition handlers
  const startListening = useCallback(async () => {
    try {
      const recognition = setupVoiceRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      let finalTranscript = '';
      
      recognition.onstart = () => {
        setIsListening(true);
        toast.success(`🎤 Listening in ${currentLanguage === 'sw' ? 'Swahili' : 'English'}...`);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update input with both final and interim
        setInputText(finalTranscript + interimTranscript);
      };

      recognition.onerror = (error: any) => {
        console.error("Speech error:", error);
        setIsListening(false);
        if (error.error !== 'no-speech') {
          toast.error(`Voice error: ${error.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (finalTranscript.trim()) {
          handleAIInteraction(finalTranscript.trim(), 'voice', undefined, true);
          setInputText('');
        }
      };

      recognition.start();
    } catch (error) {
      console.error("Voice start error:", error);
      setIsListening(false);
      toast.error("Could not start voice recognition");
    }
  }, [handleAIInteraction, setupVoiceRecognition, currentLanguage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Video functions
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsVideoOn(true);
        setCurrentMode('video');
        toast.success("📹 Camera activated!");
        
        const msg: ConversationMessage = {
          type: 'ai',
          content: "🎥 Camera is active! I can see through your camera. Ask me to describe what I see.",
          timestamp: new Date(),
          id: Date.now().toString()
        };
        setConversation(prev => [...prev, msg]);
        speakText("Camera is now active. I can see through your camera. Ask me to describe what I see.");
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      toast.error(`Camera failed: ${error.message}`);
    }
  }, [speakText]);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    setCurrentMode('text');
    toast.success("📹 Camera stopped");
  }, []);

  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !isVideoOn) {
      toast.error("Please turn on camera first");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    await handleAIInteraction(
      "Describe everything you see in this image in detail.",
      'video', 
      [{ type: 'image/jpeg', data: imageData, name: 'camera-capture.jpg' }],
      true
    );
    
    toast.success("📸 Photo captured!");
  }, [isVideoOn, handleAIInteraction]);

  // File upload handler
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    toast.info(`📁 Processing ${file.name}...`);
    
    try {
      const fileData = await analyzeFile(file);
      setAttachedFiles(prev => [...prev, fileData]);
      toast.success(`📁 ${file.name} attached! Add your message and send.`);
    } catch (error) {
      toast.error(`Failed to process ${file.name}`);
    }
  }, [analyzeFile]);

  // Auth handlers
  const handleLogin = useCallback(async () => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email: authEmail, 
      password: authPassword 
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logged in!");
    setShowAuthDialog(false);
    setAuthEmail('');
    setAuthPassword('');
  }, [authEmail, authPassword]);

  const handleSignup = useCallback(async () => {
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { 
        data: { full_name: authName },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email.");
    setShowAuthDialog(false);
  }, [authEmail, authPassword, authName]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success("Logged out");
  }, []);

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

  // New chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(Date.now().toString());
    setConversation([]);
    toast.success("New chat started");
  }, []);

  // Load chat from history
  const loadChat = useCallback((chat: ChatHistory) => {
    setCurrentConversationId(chat.id);
    setConversation(chat.messages);
    setShowHistoryDialog(false);
    toast.success("Chat loaded");
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header with Dropdown */}
      <header className="flex items-center justify-between p-4 bg-black">
        <div className="flex items-center space-x-4">
          {/* Main Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/5 text-xl font-semibold">
                Nurath.AI
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-white/10 text-white">
              <DropdownMenuItem onClick={startNewChat} className="hover:bg-white/5 cursor-pointer">
                <Plus className="w-4 h-4 mr-3" />
                New Chat
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowHistoryDialog(true)} className="hover:bg-white/5 cursor-pointer">
                <History className="w-4 h-4 mr-3" />
                Chat History
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              {/* Language Selection */}
              <DropdownMenuItem 
                onClick={() => {
                  const newLang = currentLanguage === 'en' ? 'sw' : 'en';
                  setCurrentLanguage(newLang);
                  toast.success(`Language: ${newLang === 'sw' ? 'Swahili' : 'English'}`);
                }}
                className="hover:bg-white/5 cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-3" />
                {currentLanguage === 'sw' ? 'Kiswahili' : 'English'}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:bg-white/5 cursor-pointer">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              {user ? (
                <>
                  <DropdownMenuItem className="hover:bg-white/5">
                    <User className="w-4 h-4 mr-3" />
                    {profile?.full_name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/5 cursor-pointer text-red-400">
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => setShowAuthDialog(true)} className="hover:bg-white/5 cursor-pointer">
                  <LogIn className="w-4 h-4 mr-3" />
                  Login / Sign Up
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mode Selection */}
          <div className="flex items-center bg-white/5 rounded-full p-1">
            <Button
              variant={currentMode === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentMode('text')}
              className={`h-8 w-8 p-0 rounded-full ${currentMode === 'text' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant={currentMode === 'voice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentMode('voice')}
              className={`h-8 w-8 p-0 rounded-full ${currentMode === 'voice' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant={currentMode === 'video' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentMode('video')}
              className={`h-8 w-8 p-0 rounded-full ${currentMode === 'video' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ThemeToggle />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-black" ref={chatContainerRef}>
        {conversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {/* AI Avatar for voice/video modes */}
            {(currentMode === 'voice' || currentMode === 'video') && (
              <div className="mb-8">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                  isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                  isListening ? 'border-blue-400 shadow-lg shadow-blue-400/50' : 
                  'border-white/20'
                } transition-all`}>
                  <img
                    src={isSpeaking ? aiAvatarImages.speaking : isListening ? aiAvatarImages.listening : aiAvatarImages.default}
                    alt="Nurath AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-4 text-white">
                  {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready'}
                </p>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ 
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {currentLanguage === 'sw' ? 'Nini ninaweza kukusaidia?' : 'What can I help you with?'}
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Button
                onClick={() => handleAIInteraction("Generate a song about love", 'text', undefined, true)}
                variant="ghost"
                className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
              >
                <Music className="w-6 h-6" />
                <span className="text-sm">Generate Song</span>
              </Button>
              <Button
                onClick={() => handleAIInteraction("What song is this?", 'text', undefined, true)}
                variant="ghost"
                className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
              >
                <Volume2 className="w-6 h-6" />
                <span className="text-sm">Identify Song</span>
              </Button>
              <Button
                onClick={() => handleAIInteraction("Set alarm for 7:00 AM", 'text', undefined, true)}
                variant="ghost"
                className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
              >
                <Clock className="w-6 h-6" />
                <span className="text-sm">Set Alarm</span>
              </Button>
              <Button
                onClick={() => { setCurrentMode('video'); startVideo(); }}
                variant="ghost"
                className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
              >
                <Eye className="w-6 h-6" />
                <span className="text-sm">Video Call</span>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Video Feed */}
            {isVideoOn && (
              <div className="p-4">
                <div className="relative max-w-2xl mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl border-2 border-green-400"
                  />
                  <Badge className="absolute top-2 left-2 bg-green-500/20 text-green-400 border-0">
                    <Video className="w-3 h-3 mr-1" /> Live
                  </Badge>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  <Button onClick={takePhoto} size="sm" className="text-white bg-white/10 hover:bg-white/20">
                    <Camera className="w-4 h-4 mr-2" /> Take Photo
                  </Button>
                  <Button onClick={stopVideo} size="sm" variant="destructive">
                    <VideoOff className="w-4 h-4 mr-2" /> Stop Camera
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4 p-6">
              {conversation.map((message) => (
                <Message
                  key={message.id}
                  content={message.content}
                  type={message.type}
                  timestamp={message.timestamp}
                  imageUrl={message.imageUrl}
                  onEdit={(newContent) => {
                    setConversation(prev => 
                      prev.map(msg => msg.id === message.id ? { ...msg, content: newContent } : msg)
                    );
                  }}
                />
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-5 py-4 text-white">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-black p-6">
        <div className="max-w-3xl mx-auto">
          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  {file.type?.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                  ) : file.type?.includes('pdf') ? (
                    <FileText className="w-4 h-4 text-red-400" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-white/50" />
                  )}
                  <span className="text-sm text-white truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="h-6 w-6 p-0 text-white/50 hover:text-red-400 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {currentMode === 'text' && (
            <div className="relative bg-white/5 rounded-2xl">
              <Textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={attachedFiles.length > 0 ? 'Add instructions for your file...' : 'Message Nurath.AI...'}
                className="resize-none bg-transparent px-6 py-4 pr-20 text-white placeholder-white/40 focus:outline-none focus:ring-0 rounded-2xl border-0 min-h-[80px]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim() || attachedFiles.length > 0) {
                      handleAIInteraction(inputText, currentMode, attachedFiles.length > 0 ? attachedFiles : undefined, false);
                      setInputText("");
                    }
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white/50 hover:text-white hover:bg-white/10"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    if (inputText.trim() || attachedFiles.length > 0) {
                      handleAIInteraction(inputText, currentMode, attachedFiles.length > 0 ? attachedFiles : undefined, false);
                      setInputText("");
                    }
                  }}
                  disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing}
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentMode === 'voice' && (
            <div className="text-center p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                  isSpeaking ? 'border-green-400' : isListening ? 'border-red-400' : 'border-white/20'
                } transition-all`}>
                  <img
                    src={isSpeaking ? aiAvatarImages.speaking : isListening ? aiAvatarImages.listening : aiAvatarImages.default}
                    alt="Nurath AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <p className="text-lg font-medium text-white">
                  {isListening ? 'Listening... Speak now!' : isSpeaking ? 'Speaking...' : 'Tap to speak'}
                </p>
                
                <Button
                  onClick={isListening ? stopListening : startListening}
                  size="lg"
                  disabled={isProcessing}
                  className={`rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
              </div>
            </div>
          )}

          {currentMode === 'video' && (
            <div className="text-center p-8">
              <div className="flex flex-col items-center space-y-4">
                {!isVideoOn && (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/10">
                    <Video className="w-12 h-12 text-white" />
                  </div>
                )}
                
                <p className="text-lg font-medium text-white">
                  {isVideoOn ? 'Video active - I can see you!' : 'Start video call'}
                </p>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={isVideoOn ? stopVideo : startVideo}
                    size="lg"
                    disabled={isProcessing}
                    className={`rounded-full ${isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {isVideoOn ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </Button>
                  
                  {isVideoOn && (
                    <Button
                      onClick={takePhoto}
                      size="lg"
                      disabled={isProcessing}
                      className="rounded-full bg-white text-black hover:bg-white/90"
                    >
                      <Eye className="w-6 h-6" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.json"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <audio ref={audioRef} preload="auto" />

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Welcome to Nurath.AI</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full bg-white/5">
              <TabsTrigger value="login" className="flex-1 text-white data-[state=active]:bg-white/10">Login</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 text-white data-[state=active]:bg-white/10">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Password</Label>
                <Input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-white text-black hover:bg-white/90">
                Login
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white">Name</Label>
                <Input 
                  value={authName} 
                  onChange={(e) => setAuthName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Password</Label>
                <Input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button onClick={handleSignup} className="w-full bg-white text-black hover:bg-white/90">
                Sign Up
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Chat History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-white/50 text-center py-8">No chat history yet</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className="p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <p className="text-white font-medium truncate">{chat.title}</p>
                  <p className="text-white/50 text-sm">{new Date(chat.date).toLocaleDateString()}</p>
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
