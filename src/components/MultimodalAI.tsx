
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
  Smile,
  BookOpen,
  Eye,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  StopCircle,
  Palette,
  Zap,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  Share,
  Edit,
  Trash2,
  Phone,
  PhoneCall,
  X,
  VolumeX,
  Accessibility,
  AlertTriangle,
  Clock,
  Shield,
  Baby,
  Sparkles,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RelationshipTag {
  id: string;
  name: string;
  relationship: string;
  imageUrl?: string;
  voicePattern?: string;
}

interface EmotionState {
  primary: string;
  confidence: number;
  tone: 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'confused' | 'stressed' | 'anxious';
  description?: string;
}

interface AIResponse {
  text: string;
  audioUrl?: string;
  emotion?: EmotionState;
  recognizedFaces?: RelationshipTag[];
  environmentDescription?: string;
  suggestions?: string[];
  imageUrl?: string;
  accessibility?: {
    sceneDescription?: string;
    objectDetection?: string[];
    navigationHelp?: string;
    emotionalSupport?: string;
  };
}

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: any[];
  hasAudio?: boolean;
  id: string;
  imageUrl?: string;
  accessibility?: {
    altText?: string;
    audioDescription?: string;
  };
}

interface AccessibilitySettings {
  visualImpairment: boolean;
  hearingImpairment: boolean;
  cognitiveSupport: boolean;
  physicalDisability: boolean;
  speechImpairment: boolean;
  isChild: boolean;
  isElderly: boolean;
  emergencyContact?: string;
  preferredVoice: 'gentle' | 'clear' | 'cheerful' | 'calm';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  speechSpeed: 'slow' | 'normal' | 'fast';
  enableVibration: boolean;
  autoDescribeImages: boolean;
  emotionalSupport: boolean;
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [inputText, setInputText] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [recognizedPeople, setRecognizedPeople] = useState<RelationshipTag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [currentScene, setCurrentScene] = useState<string>("");
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    visualImpairment: false,
    hearingImpairment: false,
    cognitiveSupport: false,
    physicalDisability: false,
    speechImpairment: false,
    isChild: false,
    isElderly: false,
    preferredVoice: 'gentle',
    fontSize: 'medium',
    speechSpeed: 'normal',
    enableVibration: true,
    autoDescribeImages: true,
    emotionalSupport: true
  });

  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    date: string;
    messages: ConversationMessage[];
  }>>([
    {
      id: '1',
      title: 'Daily Assistant Chat',
      date: 'Today',
      messages: []
    }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('1');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const vibrationRef = useRef<number | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // REAL Voice Recognition Setup
  const setupVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice recognition not supported in this browser");
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    return recognition;
  }, []);

  // REAL Text-to-Speech Function
  const speakText = useCallback(async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      if (priority === 'high' && synthesisRef.current) {
        speechSynthesis.cancel();
      }

      // Use browser TTS first for immediate response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = accessibilitySettings.speechSpeed === 'slow' ? 0.7 : 
                        accessibilitySettings.speechSpeed === 'fast' ? 1.3 : 1.0;
        utterance.pitch = accessibilitySettings.isChild ? 1.2 : 
                         accessibilitySettings.isElderly ? 0.9 : 1.0;
        utterance.volume = 0.9;

        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes(accessibilitySettings.preferredVoice) ||
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('natural')
          ) || voices[0];
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        synthesisRef.current = utterance;
        speechSynthesis.speak(utterance);
      }

      // Also generate high-quality TTS via API for better voice
      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input: text,
          mode: 'tts',
          settings: accessibilitySettings
        }
      });

      if (!error && data?.audioUrl) {
        // Play the high-quality audio
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, [accessibilitySettings]);

  // REAL File Analysis Function
  const analyzeFile = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            
            const { data, error } = await supabase.functions.invoke('multimodal-ai', {
              body: {
                input: `Please analyze this ${file.type.includes('image') ? 'image' : 'document'} in detail and provide insights.`,
                mode: file.type.includes('image') ? 'image' : 'document',
                attachments: [{
                  type: file.type,
                  data: base64Data,
                  name: file.name,
                  size: file.size
                }],
                context: {
                  settings: accessibilitySettings,
                  fileAnalysis: true
                }
              }
            });

            if (error) throw error;
            
            setUploadedFiles(prev => [...prev, file]);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('File analysis error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [accessibilitySettings]);

  // REAL Image Generation Function
  const generateImage = useCallback(async (prompt: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input: prompt,
          mode: 'image_generation',
          generateImage: true,
          context: {
            settings: accessibilitySettings
          }
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [accessibilitySettings]);

  // Enhanced AI interaction with REAL functionality
  const handleAIInteraction = useCallback(async (
    input: string, 
    mode: 'text' | 'voice' | 'image' | 'video' | 'accessibility' | 'image_generation' | 'document' = 'text', 
    attachments?: any[]
  ) => {
    try {
      console.log("🧠 Starting REAL AI interaction:", { input, mode, accessibility: accessibilitySettings });
      
      setIsProcessing(true);

      // REAL voice input - announce what user said
      if (mode === 'voice') {
        await speakText(`You said: ${input}. Let me help you with that.`, 'normal');
      }

      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments,
        id: Date.now().toString(),
        accessibility: {
          altText: mode === 'voice' ? 'Voice message' : mode === 'image' ? 'Image message' : undefined
        }
      };

      setConversation(prev => [...prev, newMessage]);

      // Show processing with voice feedback
      await speakText("Processing your request, please wait.", 'normal');
      toast.loading("🧠 AI is thinking and preparing response...");

      // For image generation requests
      if (input.toLowerCase().includes('generate') || input.toLowerCase().includes('create') || 
          (input.toLowerCase().includes('image') || input.toLowerCase().includes('logo') || 
           input.toLowerCase().includes('anime') || input.toLowerCase().includes('art'))) {
        mode = 'image_generation';
      }

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode,
          attachments,
          videoEnabled: isVideoOn,
          generateImage: mode === 'image_generation',
          analyzeFile: attachments && attachments.length > 0,
          context: {
            settings: accessibilitySettings,
            currentEmotion,
            recognizedPeople,
            currentScene,
            detectedObjects,
            conversationHistory: conversation.slice(-10),
            emergencyMode: isEmergency,
            uploadedFiles: uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
          }
        }
      });

      toast.dismiss();
      setIsProcessing(false);

      if (error) {
        console.error('🚨 AI Error:', error);
        const errorText = "I'm sorry, I'm having trouble right now. Please try again.";
        await speakText(errorText, 'high');
        throw error;
      }

      const aiResponse: AIResponse = data;

      // Update states based on response
      if (aiResponse.accessibility) {
        if (aiResponse.accessibility.sceneDescription) {
          setCurrentScene(aiResponse.accessibility.sceneDescription);
          if (accessibilitySettings.visualImpairment) {
            await speakText(`Scene update: ${aiResponse.accessibility.sceneDescription}`, 'normal');
          }
        }
        
        if (aiResponse.accessibility.objectDetection) {
          setDetectedObjects(aiResponse.accessibility.objectDetection);
          if (accessibilitySettings.visualImpairment) {
            await speakText(`Objects detected: ${aiResponse.accessibility.objectDetection.join(', ')}`, 'normal');
          }
        }
      }

      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
        if (accessibilitySettings.visualImpairment) {
          const peopleNames = aiResponse.recognizedFaces.map(p => p.name).join(', ');
          await speakText(`I can see: ${peopleNames}`, 'normal');
        }
      }

      if (aiResponse.emotion) {
        setCurrentEmotion(aiResponse.emotion);
      }

      const aiMessage: ConversationMessage = {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl,
        id: Date.now().toString(),
        imageUrl: aiResponse.imageUrl,
        accessibility: {
          audioDescription: aiResponse.accessibility?.sceneDescription
        }
      };

      setConversation(prev => [...prev, aiMessage]);

      // ALWAYS speak the response for accessibility
      await speakText(aiResponse.text, 'normal');

      // Handle generated images
      if (aiResponse.imageUrl) {
        await speakText("I've created an image for you. You can view it in our conversation.", 'normal');
      }

      // Handle audio responses
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          audioRef.current.src = aiResponse.audioUrl;
          await audioRef.current.play();
        } catch (audioError) {
          console.error('Audio playback error:', audioError);
        }
      }

    } catch (error) {
      console.error('🚨 AI interaction error:', error);
      const errorText = "I'm sorry, I'm having technical difficulties. Please try speaking to me again.";
      await speakText(errorText, 'high');
      toast.error("Technical issue - please try again");
      
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: errorText,
        timestamp: new Date(),
        hasAudio: false,
        id: Date.now().toString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [
    accessibilitySettings, 
    currentEmotion, 
    recognizedPeople, 
    currentScene, 
    detectedObjects, 
    conversation, 
    isEmergency, 
    isVideoOn,
    uploadedFiles,
    speakText
  ]);

  // REAL Voice Recognition
  const startListening = useCallback(async () => {
    try {
      const recognition = setupVoiceRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      
      recognition.onstart = () => {
        setIsListening(true);
        speakText("I'm listening", 'normal');
        toast.success("🎤 Listening...");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log("🎤 Voice input:", transcript);
        
        setInputText(transcript);
        handleAIInteraction(transcript, 'voice');
        setIsListening(false);
      };

      recognition.onerror = (error) => {
        console.error("🚨 Speech recognition error:", error);
        speakText("Voice recognition error. Please try again.", 'high');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("🚨 Voice recognition start error:", error);
      speakText("Could not start voice recognition. Please try typing instead.", 'high');
    }
  }, [handleAIInteraction, speakText, setupVoiceRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // REAL Camera Functions
  const startVideo = useCallback(async () => {
    try {
      console.log("📹 Starting REAL camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsVideoOn(true);
      
      await speakText("Camera activated. I can now see your environment.", 'normal');
      toast.success("🎥 Camera activated!");
      
      // Auto-describe for visual impairment
      if (accessibilitySettings.visualImpairment || accessibilitySettings.autoDescribeImages) {
        setTimeout(() => {
          handleAIInteraction(
            "Please describe what you see in detail, including people, objects, text, colors, and spatial relationships. Help me understand my surroundings completely.", 
            'video'
          );
        }, 2000);
      }
      
    } catch (error) {
      console.error("🚨 Camera error:", error);
      await speakText("Camera access denied. Please enable camera permissions.", 'high');
      toast.error("Camera access needed");
    }
  }, [accessibilitySettings, handleAIInteraction, speakText]);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    speakText("Camera stopped", 'normal');
    toast.info("Camera stopped");
  }, [speakText]);

  // File Upload with REAL Analysis
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    console.log("📁 REAL file upload and analysis:", file.name, file.type);
    await speakText("Processing your file, please wait.", 'normal');

    try {
      const analysisResult = await analyzeFile(file);
      
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document';

      await handleAIInteraction(
        `I've uploaded a ${fileType} file named "${file.name}". Please analyze it thoroughly and tell me everything you can discover from it.`,
        fileType as any,
        [analysisResult]
      );
    } catch (error) {
      console.error('File upload error:', error);
      await speakText("Sorry, I had trouble analyzing that file. Please try again.", 'high');
    }
  }, [analyzeFile, handleAIInteraction, speakText]);

  // Take Photo with REAL Analysis
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isVideoOn) {
      speakText("Please turn on the camera first", 'high');
      toast.error("Camera needed");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          
          await handleAIInteraction(
            "I just took a photo. Please describe everything you see in great detail - people, objects, surroundings, and help me understand my environment completely.",
            'image',
            [{ type: 'image', data: base64Data, name: 'accessibility-photo.jpg' }]
          );
        };
        reader.readAsDataURL(file);
        await speakText("Photo captured. Analyzing what I can see.", 'normal');
        toast.success("📸 Photo captured and analyzing...");
      }
    }, 'image/jpeg', 0.8);
  }, [isVideoOn, handleAIInteraction, speakText]);

  // Message Actions
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied!");
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingText(content);
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setConversation(prev => prev.filter(msg => msg.id !== messageId));
    toast.success("Message deleted");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingMessageId || !editingText.trim()) return;

    setConversation(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, content: editingText.trim() }
        : msg
    ));

    const message = conversation.find(m => m.id === editingMessageId);
    if (message?.type === 'user') {
      await handleAIInteraction(editingText.trim());
    }

    setEditingMessageId(null);
    setEditingText("");
    toast.success("Message updated and resent");
  }, [editingMessageId, editingText, conversation, handleAIInteraction]);

  // New Chat
  const startNewChat = useCallback(() => {
    const newConversationId = Date.now().toString();
    const newConversation = {
      id: newConversationId,
      title: 'New Chat',
      date: 'Today',
      messages: []
    };
    
    setConversationHistory(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversationId);
    setConversation([]);
    setInputText("");
    speakText("Started new conversation", 'normal');
    toast.success("Started new conversation");
  }, [speakText]);

  // Load conversation
  const loadConversation = useCallback((conversationId: string) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConversationId(conversationId);
      setConversation(conv.messages);
      setIsSidebarOpen(false);
      speakText(`Loaded conversation: ${conv.title}`, 'normal');
    }
  }, [conversationHistory, speakText]);

  // Auto-play audio responses
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  // Welcome message
  useEffect(() => {
    const welcomeMessage = accessibilitySettings.isChild 
      ? "Hi there! I'm your friendly AI assistant. I can talk, see, and help you with anything!"
      : accessibilitySettings.isElderly 
      ? "Hello, I'm your AI companion. I'm here to assist you and keep you company."
      : "Welcome to your accessible AI assistant. I can speak, see, and help with all your needs.";
    
    setTimeout(() => speakText(welcomeMessage, 'normal'), 1000);
  }, [accessibilitySettings, speakText]);

  return (
    <div className={`flex h-screen bg-white dark:bg-gray-900 ${
      accessibilitySettings.fontSize === 'large' ? 'text-lg' : 
      accessibilitySettings.fontSize === 'extra-large' ? 'text-xl' : 'text-base'
    }`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50`}>
        {isSidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative z-50 bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button 
                    className="flex-1 justify-start bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl"
                    onClick={startNewChat}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden ml-2 rounded-xl"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto px-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">Recent</div>
                  {conversationHistory.map((conv) => (
                    <div key={conv.id} className="group relative">
                      <button
                        onClick={() => loadConversation(conv.id)}
                        className={`w-full text-left p-2 text-sm rounded-xl truncate transition-colors ${
                          currentConversationId === conv.id 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {conv.title}
                      </button>
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationHistory(prev => prev.filter(c => c.id !== conv.id));
                            speakText("Conversation deleted", 'normal');
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Settings */}
              <div className="p-2 space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 dark:text-gray-300 rounded-xl"
                  onClick={() => speakText("Settings available. You can adjust voice, accessibility, and preferences.", 'normal')}
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
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
                <h1 className={`font-bold text-gray-900 dark:text-white mb-8 ${
                  accessibilitySettings.fontSize === 'large' ? 'text-5xl' : 
                  accessibilitySettings.fontSize === 'extra-large' ? 'text-6xl' : 'text-4xl'
                }`}>
                  What can I help you with?
                </h1>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={() => handleAIInteraction("Please sing me a beautiful song with your voice and sing the actual lyrics", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">Sing Song</span>
                  </Button>
                  <Button
                    onClick={() => {
                      startVideo();
                      setTimeout(() => handleAIInteraction("Tell me what you can see around me and describe my environment", 'video'), 2000);
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">Describe Scene</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("I need emotional support and comfort right now", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Heart className="w-6 h-6" />
                    <span className="text-sm">Emotional Support</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Help me with my daily routine and remind me of important things", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">Daily Help</span>
                  </Button>
                  <Button
                    onClick={() => {
                      startVideo();
                      setTimeout(() => handleAIInteraction("Who is around me? Please recognize faces and tell me about people nearby", 'video'), 2000);
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Recognize People</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Generate a beautiful creative image or anime artwork for me", 'image_generation')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Palette className="w-6 h-6" />
                    <span className="text-sm">Create Image</span>
                  </Button>
                  <Button
                    onClick={startVideo}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-gray-200"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-sm">Start Camera</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEmergency(true);
                      handleAIInteraction("This is an emergency situation. I need help.", 'voice');
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl border-red-200 text-red-600"
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed */}
              {isVideoOn && (
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
                        onClick={() => handleAIInteraction("Describe my surroundings and tell me where I am in detail", 'video')}
                        size="sm" 
                        variant="outline"
                        className="rounded-xl"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Describe Location
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
              <div className="space-y-6 p-4">
                {conversation.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group relative`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user' 
                          ? 'bg-white border border-gray-200 text-gray-900' 
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[60px] text-sm rounded-xl"
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={saveEdit} className="rounded-xl">
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingText("");
                                }}
                                className="rounded-xl"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                message.type === 'user' 
                                  ? 'bg-blue-500' 
                                  : 'bg-purple-500'
                              }`}>
                                {message.type === 'user' ? <Users className="w-3 h-3 text-white" /> : <Brain className="w-3 h-3 text-white" />}
                              </div>
                              <span className="font-medium text-sm">
                                {message.type === 'user' ? 'You' : 'Nurath.AI'}
                              </span>
                              {message.hasAudio && (
                                <div className="flex items-center gap-1">
                                  <Volume2 className="w-4 h-4 text-green-400" />
                                </div>
                              )}
                            </div>
                            
                            <p className={`leading-relaxed ${
                              accessibilitySettings.fontSize === 'large' ? 'text-lg' : 
                              accessibilitySettings.fontSize === 'extra-large' ? 'text-xl' : 'text-sm'
                            }`}>
                              {message.content}
                            </p>
                            
                            {message.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={message.imageUrl} 
                                  alt={message.accessibility?.altText || "Generated content"} 
                                  className="max-w-full h-auto rounded-xl"
                                />
                              </div>
                            )}
                            
                            <span className="text-xs opacity-70 mt-2 block">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Hover Actions */}
                      {editingMessageId !== message.id && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 flex space-x-1 bg-white rounded-xl shadow-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {message.type === 'user' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => editMessage(message.id, message.content)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => deleteMessage(message.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-900 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message Nurath.AI..."
                className={`resize-none bg-transparent border-none px-4 py-3 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 rounded-2xl ${
                  accessibilitySettings.fontSize === 'large' ? 'text-lg min-h-[80px]' : 
                  accessibilitySettings.fontSize === 'extra-large' ? 'text-xl min-h-[100px]' : 'text-base min-h-[60px]'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim()) {
                      handleAIInteraction(inputText);
                      setInputText("");
                    }
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isListening ? stopListening : startListening}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl"
                >
                  {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isVideoOn ? stopVideo : startVideo}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl"
                >
                  {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => {
                    if (inputText.trim()) {
                      handleAIInteraction(inputText);
                      setInputText("");
                    }
                  }}
                  disabled={!inputText.trim()}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
