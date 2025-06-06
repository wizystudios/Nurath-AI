
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Heart, 
  Brain, 
  Users,
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
  Menu,
  Plus,
  Settings,
  X,
  Shield,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import UserAuthButton from "@/components/UserAuthButton";

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: any[];
  hasAudio?: boolean;
  id: string;
  imageUrl?: string;
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<'text' | 'voice' | 'video'>('text');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    date: string;
    messages: ConversationMessage[];
  }>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  // Initialize recognition with better browser support
  const setupVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice recognition not supported - please try Chrome or Edge browser");
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    return recognition;
  }, []);

  // Enhanced TTS with better error handling
  const speakText = useCallback(async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      console.log('🔊 Starting TTS for:', text.substring(0, 50) + '...');
      
      if (priority === 'high' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }

      setIsSpeaking(true);

      // Try browser TTS first for immediate feedback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // Get available voices and select a female voice
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('zira') ||
            // Remove the gender check that was causing the error
            voice.name.toLowerCase().includes('woman')
          ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
        }

        utterance.onstart = () => {
          console.log('🔊 Browser TTS started');
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log('🔊 Browser TTS ended');
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error('🔊 Browser TTS error:', event);
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      }

      // Also try high-quality TTS via API
      try {
        console.log('🔊 Attempting API TTS...');
        const { data, error } = await supabase.functions.invoke('multimodal-ai', {
          body: {
            input: text.substring(0, 4000), // Limit text length
            mode: 'tts',
            context: { 
              settings: { 
                speechSpeed: 'normal',
                preferredVoice: 'shimmer'
              }
            }
          }
        });

        if (!error && data?.audioUrl) {
          console.log('🔊 API TTS successful');
          if (audioRef.current) {
            audioRef.current.src = data.audioUrl;
            audioRef.current.oncanplaythrough = () => {
              audioRef.current?.play().catch(err => {
                console.error('Audio play error:', err);
              });
            };
            audioRef.current.onended = () => setIsSpeaking(false);
            audioRef.current.onerror = () => setIsSpeaking(false);
          }
        } else {
          console.log('🔊 API TTS failed, using browser TTS only');
        }
      } catch (apiError) {
        console.log('🔊 API TTS error:', apiError);
      }
    } catch (error) {
      console.error('🔊 TTS Error:', error);
      setIsSpeaking(false);
      toast.error('Speech synthesis failed');
    }
  }, []);

  // Enhanced file analysis
  const analyzeFile = useCallback(async (file: File) => {
    try {
      console.log('📁 Analyzing file:', file.name, file.type);
      setIsProcessing(true);
      
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            console.log('📁 File read successfully, size:', base64Data.length);
            
            const { data, error } = await supabase.functions.invoke('multimodal-ai', {
              body: {
                input: `Please analyze this ${file.type.includes('image') ? 'image' : 'document'} thoroughly. Describe everything you can see or find in detail.`,
                mode: file.type.includes('image') ? 'image' : 'document',
                attachments: [{
                  type: file.type,
                  data: base64Data,
                  name: file.name,
                  size: file.size
                }],
                analyzeFile: true,
                context: {
                  fileAnalysis: true,
                  fileName: file.name,
                  fileType: file.type
                }
              }
            });

            if (error) {
              console.error('📁 Analysis error:', error);
              throw new Error(error.message || 'File analysis failed');
            }
            
            console.log('📁 Analysis successful');
            resolve(data);
          } catch (err) {
            console.error('📁 Analysis processing error:', err);
            reject(err);
          }
        };
        
        reader.onerror = (err) => {
          console.error('📁 File read error:', err);
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('📁 File analysis setup error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Enhanced AI interaction with better error handling
  const handleAIInteraction = useCallback(async (
    input: string, 
    mode: 'text' | 'voice' | 'image' | 'video' | 'image_generation' | 'document' = 'text', 
    attachments?: any[],
    forceSpeak: boolean = false
  ) => {
    try {
      console.log("🧠 AI Interaction:", { input: input.substring(0, 50), mode, forceSpeak });
      
      if (!input.trim() && !attachments?.length) {
        toast.error("Please provide some input");
        return;
      }

      setIsProcessing(true);

      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments,
        id: Date.now().toString()
      };

      setConversation(prev => [...prev, newMessage]);

      // Determine if this should generate an image
      const imageKeywords = ['generate', 'create', 'make', 'draw', 'design', 'show me'];
      const imageTypes = ['image', 'picture', 'photo', 'logo', 'artwork', 'art', 'anime', 'drawing', 'illustration'];
      
      const shouldGenerateImage = mode === 'image_generation' || 
          (imageKeywords.some(keyword => input.toLowerCase().includes(keyword)) && 
           imageTypes.some(type => input.toLowerCase().includes(type)));

      // Only speak if in voice mode, forced, or for specific actions
      const shouldSpeak = currentMode === 'voice' || forceSpeak || mode === 'voice';

      console.log("🧠 Calling Supabase function...");
      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode: shouldGenerateImage ? 'image_generation' : mode,
          attachments,
          videoEnabled: isVideoOn,
          generateImage: shouldGenerateImage,
          analyzeFile: attachments && attachments.length > 0,
          shouldSpeak: shouldSpeak,
          context: {
            currentMode,
            userId: user?.id,
            conversationHistory: conversation.slice(-5) // Send last 5 messages for context
          }
        }
      });

      if (error) {
        console.error('🚨 AI Error:', error);
        throw new Error(error.message || 'AI service temporarily unavailable');
      }

      console.log("🧠 AI Response received:", data?.text?.substring(0, 50));

      const aiResponse = data;
      const aiMessage: ConversationMessage = {
        type: 'ai',
        content: aiResponse.text || 'I apologize, but I had trouble processing your request.',
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl,
        id: (Date.now() + 1).toString(),
        imageUrl: aiResponse.imageUrl
      };

      setConversation(prev => [...prev, aiMessage]);

      // Handle image generation success
      if (aiResponse.imageUrl) {
        toast.success("🎨 Image generated successfully!");
      }

      // Handle audio playback
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          console.log('🔊 Playing API audio response');
          audioRef.current.src = aiResponse.audioUrl;
          setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          await audioRef.current.play();
        } catch (audioError) {
          console.error('🔊 Audio playback error:', audioError);
          setIsSpeaking(false);
          // Fallback to browser TTS
          if (shouldSpeak) {
            await speakText(aiResponse.text, 'normal');
          }
        }
      } else if (shouldSpeak) {
        // Use browser TTS
        await speakText(aiResponse.text, 'normal');
      }

      // Save conversation if user is logged in
      if (user && currentConversationId) {
        try {
          await supabase.from('chat_messages').insert([
            {
              user_id: user.id,
              conversation_id: currentConversationId,
              role: 'user',
              content: input,
              type: mode
            },
            {
              user_id: user.id,
              conversation_id: currentConversationId,
              role: 'assistant',
              content: aiResponse.text,
              type: 'text'
            }
          ]);
        } catch (saveError) {
          console.error('Error saving conversation:', saveError);
        }
      }

    } catch (error) {
      console.error('🚨 AI interaction error:', error);
      const errorText = error.message || "I'm having technical difficulties. Please try again.";
      
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: errorText,
        timestamp: new Date(),
        hasAudio: false,
        id: (Date.now() + 2).toString()
      };
      setConversation(prev => [...prev, errorMessage]);
      
      if (currentMode === 'voice' || forceSpeak) {
        await speakText(errorText, 'high');
      }
      
      toast.error(errorText);
    } finally {
      setIsProcessing(false);
    }
  }, [currentMode, isVideoOn, conversation, user, currentConversationId, speakText]);

  // Enhanced voice recognition
  const startListening = useCallback(async () => {
    try {
      const recognition = setupVoiceRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log("🎤 Voice recognition started");
        toast.success("🎤 Listening... Speak now!");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("🎤 Voice input received:", transcript);
        
        if (transcript.trim()) {
          setInputText(transcript);
          handleAIInteraction(transcript, 'voice', undefined, true);
        }
        setIsListening(false);
      };

      recognition.onerror = (error) => {
        console.error("🚨 Speech recognition error:", error);
        setIsListening(false);
        toast.error(`Voice recognition error: ${error.error}. Please check microphone permissions.`);
      };

      recognition.onend = () => {
        console.log("🎤 Voice recognition ended");
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("🚨 Voice recognition start error:", error);
      setIsListening(false);
      toast.error("Could not start voice recognition. Please check microphone permissions.");
    }
  }, [handleAIInteraction, setupVoiceRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Enhanced camera functions with better error handling
  const startVideo = useCallback(async () => {
    try {
      console.log("📹 Starting camera...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        }, 
        audio: false // Start with video only to avoid audio feedback
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsVideoOn(true);
        console.log("📹 Camera started successfully");
        toast.success("🎥 Camera activated!");
        
        if (currentMode === 'video') {
          await speakText("Camera is now active. I can see your environment.", 'normal');
          
          // Auto-analyze after a short delay
          setTimeout(() => {
            handleAIInteraction(
              "Please describe everything you can see in my environment in detail, including any people, objects, and surroundings.", 
              'video',
              undefined,
              true
            );
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error("🚨 Camera error:", error);
      let errorMessage = "Camera access failed. ";
      
      if (error.name === 'NotFoundError') {
        errorMessage += "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage += "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Camera is being used by another application.";
      } else {
        errorMessage += error.message || "Unknown camera error.";
      }
      
      await speakText(errorMessage, 'high');
      toast.error(errorMessage);
    }
  }, [handleAIInteraction, speakText, currentMode]);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("📹 Camera track stopped");
      });
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    if (currentMode === 'video') {
      speakText("Camera stopped", 'normal');
    }
    toast.info("Camera stopped");
  }, [speakText, currentMode]);

  // File upload with proper analysis
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    console.log("📁 File upload started:", file.name, file.type, file.size);
    
    try {
      await speakText(`Processing your ${file.type.includes('image') ? 'image' : 'document'} file. Please wait.`, 'normal');
      
      const analysisResult = await analyzeFile(file);
      
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document';

      await handleAIInteraction(
        `I've uploaded a ${fileType} file named "${file.name}". Please analyze it thoroughly and tell me everything you can discover from it.`,
        fileType as any,
        [{ 
          type: file.type, 
          data: analysisResult, 
          name: file.name, 
          size: file.size 
        }],
        true
      );
    } catch (error) {
      console.error('📁 File upload error:', error);
      await speakText("Sorry, I had trouble analyzing that file. Please try again with a different file.", 'high');
      toast.error('File analysis failed');
    }
  }, [analyzeFile, handleAIInteraction, speakText]);

  // Take photo and analyze
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !isVideoOn) {
      const message = "Please turn on the camera first to take a photo.";
      await speakText(message, 'high');
      toast.error(message);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            
            await handleAIInteraction(
              "I just took a photo. Please describe everything you see in great detail - people, objects, surroundings, colors, and help me understand my environment completely.",
              'image',
              [{ type: 'image', data: base64Data, name: 'photo.jpg' }],
              true
            );
          };
          reader.readAsDataURL(file);
          await speakText("Photo captured. Analyzing what I can see.", 'normal');
          toast.success("📸 Photo captured and analyzing...");
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('📸 Photo capture error:', error);
      toast.error('Failed to capture photo');
    }
  }, [isVideoOn, handleAIInteraction, speakText]);

  // Authentication check
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

        // Create initial conversation if none exists
        if (!currentConversationId) {
          const newConversationId = Date.now().toString();
          setCurrentConversationId(newConversationId);
        }
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setProfile(null);
        setConversationHistory([]);
        setConversation([]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [currentConversationId]);

  // Handle user login/signup/logout
  const handleLogin = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logged in successfully!");
  }, []);

  const handleSignup = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created successfully! Please check your email.");
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setConversationHistory([]);
    setConversation([]);
    toast.success("Logged out successfully");
  }, []);

  // Start new chat
  const startNewChat = useCallback(() => {
    const newConversationId = Date.now().toString();
    setCurrentConversationId(newConversationId);
    setConversation([]);
    toast.success("New chat started");
  }, []);

  // Quick action handler with proper voice response
  const handleQuickAction = useCallback(async (actionType: string, prompt: string) => {
    const shouldSpeak = ['sing', 'emotional', 'daily', 'emergency', 'recognize'].some(action => 
      actionType.includes(action) || prompt.toLowerCase().includes(action)
    );
    
    await handleAIInteraction(
      prompt, 
      actionType === 'video' ? 'video' : actionType === 'voice' ? 'voice' : 'text', 
      undefined, 
      shouldSpeak
    );
  }, [handleAIInteraction]);

  // Auto-setup when mode changes
  useEffect(() => {
    if (currentMode === 'voice' && !isListening && !isProcessing) {
      // Auto-start listening when switching to voice mode
      setTimeout(() => startListening(), 500);
    } else if (currentMode !== 'voice' && isListening) {
      stopListening();
    }

    if (currentMode === 'video' && !isVideoOn) {
      // Auto-start video when switching to video mode
      setTimeout(() => startVideo(), 500);
    } else if (currentMode !== 'video' && isVideoOn) {
      stopVideo();
    }
  }, [currentMode, startListening, stopListening, startVideo, stopVideo, isListening, isVideoOn, isProcessing]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50`}>
        {isSidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative z-50 bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
              {/* Profile & New Chat */}
              <div className="p-3">
                <UserAuthButton
                  isLoggedIn={!!user}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  onLogout={handleLogout}
                  username={profile?.full_name || user?.email}
                />
                
                <Button 
                  className="w-full justify-start bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl mt-3"
                  onClick={startNewChat}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New chat
                </Button>
              </div>

              {/* Settings */}
              <div className="p-2 space-y-1 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 dark:text-gray-300 rounded-xl"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 dark:text-gray-400 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-semibold text-gray-900 dark:text-white">Nurath.AI</div>
            
            {/* Mode Selection - Icons Only */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
              <Button
                variant={currentMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('text')}
                className="h-8 w-8 p-0 rounded-full"
                title="Text Mode"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('voice')}
                className="h-8 w-8 p-0 rounded-full"
                title="Voice Mode"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'video' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('video')}
                className="h-8 w-8 p-0 rounded-full"
                title="Video Mode"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Status Badges */}
            {isListening && (
              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 animate-pulse rounded-full">
                <Mic className="w-3 h-3 mr-1" />
                Listening
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 animate-pulse rounded-full">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 animate-pulse rounded-full">
                <Brain className="w-3 h-3 mr-1" />
                Processing
              </Badge>
            )}
          </div>
          <ThemeToggle />
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {conversation.length === 0 ? (
            // Welcome State
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 animate-pulse" style={{ 
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  What can I help you with?
                </h1>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={() => handleQuickAction('sing', "Please sing me a beautiful song with your voice and sing the actual lyrics")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">Sing Song</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentMode('video');
                      setTimeout(() => handleQuickAction('video', "Tell me what you can see around me and describe my environment"), 2000);
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">Describe Scene</span>
                  </Button>
                  <Button
                    onClick={() => handleQuickAction('emotional', "I need emotional support and comfort right now")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Heart className="w-6 h-6" />
                    <span className="text-sm">Emotional Support</span>
                  </Button>
                  <Button
                    onClick={() => handleQuickAction('daily', "Help me with my daily routine and remind me of important things")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">Daily Help</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentMode('video');
                      setTimeout(() => handleQuickAction('recognize', "Who is around me? Please recognize faces and tell me about people nearby"), 2000);
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Recognize People</span>
                  </Button>
                  <Button
                    onClick={() => setCurrentMode('video')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-sm">Start Camera</span>
                  </Button>
                  <Button
                    onClick={() => handleQuickAction('emergency', "This is an emergency situation. I need help.")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-red-200 text-red-600 hover:scale-105 transition-transform"
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                  <Button
                    onClick={() => handleQuickAction('image', "Generate a beautiful anime artwork for me")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span className="text-sm">Generate Art</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed */}
              {isVideoOn && currentMode === 'video' && (
                <div className="p-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 flex flex-wrap gap-2">
                      <Button onClick={takePhoto} size="sm" variant="outline" className="rounded-xl">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction("Describe my surroundings in detail", 'video', undefined, true)}
                        size="sm" 
                        variant="outline"
                        className="rounded-xl"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Analyze Scene
                      </Button>
                      <Button onClick={stopVideo} size="sm" variant="destructive" className="rounded-xl">
                        <VideoOff className="w-4 h-4" />
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4 p-4">
                {conversation.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-blue-400' : 'bg-purple-500'
                        }`}>
                          {message.type === 'user' ? <Users className="w-3 h-3 text-white" /> : <Brain className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-xs">
                          {message.type === 'user' ? 'You' : 'Nurath.AI'}
                        </span>
                        {message.hasAudio && <Volume2 className="w-4 h-4 text-green-400" />}
                      </div>
                      
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {message.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={message.imageUrl} 
                            alt="Generated content" 
                            className="max-w-full h-auto rounded-xl"
                          />
                        </div>
                      )}
                      
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Dynamic based on mode */}
        <div className="bg-white dark:bg-gray-900 p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            {currentMode === 'text' && (
              <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message Nurath.AI..."
                  className="resize-none bg-transparent px-6 py-4 pr-20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 rounded-2xl border-0 min-h-[80px]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputText.trim()) {
                        handleAIInteraction(inputText, currentMode);
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
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (inputText.trim()) {
                        handleAIInteraction(inputText, currentMode);
                        setInputText("");
                      }
                    }}
                    disabled={!inputText.trim() || isProcessing}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentMode === 'voice' && (
              <div className="text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                    }`}>
                      <Mic className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {isListening ? 'Listening... Speak now!' : 'Tap to speak with AI'}
                    </p>
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      disabled={isProcessing}
                      className={`rounded-full ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentMode === 'video' && (
              <div className="text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      isVideoOn ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      <Video className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {isVideoOn ? 'Video call active - I can see you!' : 'Start video call with AI'}
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={isVideoOn ? stopVideo : startVideo}
                        size="lg"
                        disabled={isProcessing}
                        className={`rounded-full ${
                          isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isVideoOn ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                      </Button>
                      {isVideoOn && (
                        <Button
                          onClick={takePhoto}
                          size="lg"
                          variant="outline"
                          className="rounded-full"
                          disabled={isProcessing}
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Elements */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default MultimodalAI;
