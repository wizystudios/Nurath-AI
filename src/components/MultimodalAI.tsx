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
  Sparkles
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

  // Accessibility-enhanced voice commands
  const voiceCommands = {
    emergency: ['help', 'emergency', 'call help', 'danger', 'urgent'],
    navigation: ['where am i', 'describe surroundings', 'what do you see', 'navigate', 'location'],
    social: ['who is here', 'recognize faces', 'who is talking', 'social situation'],
    emotion: ['how do i feel', 'mood check', 'emotional support', 'comfort me'],
    routine: ['remind me', 'schedule', 'medicine time', 'eat', 'sleep'],
    entertainment: ['sing song', 'tell story', 'tell joke', 'play music', 'calm me'],
    control: ['take photo', 'call someone', 'open app', 'control lights']
  };

  // Enhanced emotion detection for accessibility
  const detectAdvancedEmotion = useCallback((input: string, voiceTone?: any) => {
    const emotionPatterns = {
      distressed: ['help', 'scared', 'panic', 'emergency', 'afraid', 'anxious'],
      confused: ['confused', 'lost', 'dont understand', 'unclear', 'explain'],
      lonely: ['lonely', 'alone', 'nobody', 'sad', 'miss', 'isolated'],
      excited: ['excited', 'happy', 'great', 'awesome', 'wonderful', 'amazing'],
      tired: ['tired', 'sleepy', 'exhausted', 'rest', 'sleep'],
      frustrated: ['frustrated', 'angry', 'annoyed', 'difficult', 'hard'],
      grateful: ['thank', 'grateful', 'appreciate', 'helpful', 'kind'],
      curious: ['what', 'how', 'why', 'tell me', 'explain', 'learn']
    };

    const inputLower = input.toLowerCase();
    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        return {
          primary: emotion,
          confidence: 0.85,
          tone: emotion as any,
          description: `User appears to be feeling ${emotion}`
        };
      }
    }

    return null;
  }, []);

  // Vibration alerts for hearing impaired
  const triggerVibration = useCallback((pattern: number[] = [200, 100, 200]) => {
    if (accessibilitySettings.enableVibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [accessibilitySettings]);

  // Enhanced TTS with accessibility options
  const speakText = useCallback(async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if ('speechSynthesis' in window) {
      // Stop current speech if high priority
      if (priority === 'high') {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Accessibility voice settings
      utterance.rate = accessibilitySettings.speechSpeed === 'slow' ? 0.7 : 
                      accessibilitySettings.speechSpeed === 'fast' ? 1.3 : 1.0;
      utterance.pitch = accessibilitySettings.isChild ? 1.2 : 
                       accessibilitySettings.isElderly ? 0.9 : 1.0;
      utterance.volume = 0.9;

      // Voice selection based on accessibility needs
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(accessibilitySettings.preferredVoice) ||
          (accessibilitySettings.isChild && voice.name.toLowerCase().includes('child')) ||
          (accessibilitySettings.isElderly && voice.name.toLowerCase().includes('gentle'))
        ) || voices[0];
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  }, [accessibilitySettings]);

  // Enhanced AI interaction with accessibility context
  const handleAIInteraction = useCallback(async (
    input: string, 
    mode: 'text' | 'voice' | 'image' | 'video' | 'accessibility' = 'text', 
    attachments?: any[]
  ) => {
    try {
      console.log("🧠 Starting accessible AI interaction:", { input, mode, accessibility: accessibilitySettings });
      
      // Detect emotion for cognitive support
      const detectedEmotion = detectAdvancedEmotion(input);
      if (detectedEmotion) {
        setCurrentEmotion(detectedEmotion);
        
        // Immediate emotional support for cognitive disabilities
        if (accessibilitySettings.cognitiveSupport && detectedEmotion.primary === 'distressed') {
          speakText("I'm here to help you. Take a deep breath. You're safe.", 'high');
          triggerVibration([100, 50, 100, 50, 100]);
        }
      }

      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments,
        id: Date.now().toString(),
        accessibility: {
          altText: mode === 'voice' ? 'Voice message' : undefined
        }
      };

      setConversation(prev => [...prev, newMessage]);

      // Show accessible loading message
      if (accessibilitySettings.visualImpairment) {
        speakText("Processing your request, please wait a moment.", 'normal');
      }
      toast.loading("🧠 Your AI assistant is thinking...");

      // Enhanced context for accessibility
      const accessibilityContext = {
        settings: accessibilitySettings,
        currentEmotion: detectedEmotion || currentEmotion,
        recognizedPeople,
        currentScene,
        detectedObjects,
        conversationHistory: conversation.slice(-10),
        emergencyMode: isEmergency
      };

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode,
          attachments,
          videoEnabled: isVideoOn,
          context: accessibilityContext
        }
      });

      toast.dismiss();

      if (error) {
        console.error('🚨 AI Error:', error);
        const errorText = "I'm sorry, I'm having trouble right now. Please try again.";
        speakText(errorText, 'high');
        throw error;
      }

      const aiResponse: AIResponse = data;

      // Update accessibility state
      if (aiResponse.accessibility) {
        if (aiResponse.accessibility.sceneDescription) {
          setCurrentScene(aiResponse.accessibility.sceneDescription);
          if (accessibilitySettings.visualImpairment) {
            speakText(`Scene update: ${aiResponse.accessibility.sceneDescription}`, 'normal');
          }
        }
        
        if (aiResponse.accessibility.objectDetection) {
          setDetectedObjects(aiResponse.accessibility.objectDetection);
          if (accessibilitySettings.visualImpairment) {
            speakText(`Objects detected: ${aiResponse.accessibility.objectDetection.join(', ')}`, 'normal');
          }
        }

        if (aiResponse.accessibility.emotionalSupport && accessibilitySettings.emotionalSupport) {
          speakText(aiResponse.accessibility.emotionalSupport, 'high');
        }
      }

      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
        if (accessibilitySettings.visualImpairment) {
          const peopleNames = aiResponse.recognizedFaces.map(p => p.name).join(', ');
          speakText(`I can see: ${peopleNames}`, 'normal');
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

      // Enhanced audio response handling
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          audioRef.current.src = aiResponse.audioUrl;
          setIsSpeaking(true);
          await audioRef.current.play();
          
          // Vibration for hearing impaired when AI speaks
          if (accessibilitySettings.hearingImpairment) {
            triggerVibration([300, 100, 300]);
          }
          
          toast.success("🔊 AI is speaking");
        } catch (audioError) {
          console.error('🚨 Audio playback error:', audioError);
          // Fallback to TTS for accessibility
          speakText(aiResponse.text, 'normal');
        }
      } else if (accessibilitySettings.visualImpairment || accessibilitySettings.cognitiveSupport) {
        // Always provide voice feedback for accessibility
        speakText(aiResponse.text, 'normal');
      }

      // Emergency detection
      if (input.toLowerCase().includes('emergency') || input.toLowerCase().includes('help')) {
        setIsEmergency(true);
        if (accessibilitySettings.emergencyContact) {
          speakText("Emergency detected. I'm here to help you. Stay calm.", 'high');
          triggerVibration([500, 200, 500, 200, 500]);
        }
      }

    } catch (error) {
      console.error('🚨 AI interaction error:', error);
      const errorText = "I'm sorry, I'm having technical difficulties. Please try speaking to me again.";
      speakText(errorText, 'high');
      toast.error("Technical issue - please try again");
      
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: errorText,
        timestamp: new Date(),
        hasAudio: false,
        id: Date.now().toString()
      };
      setConversation(prev => [...prev, errorMessage]);
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
    detectAdvancedEmotion,
    speakText,
    triggerVibration
  ]);

  // Enhanced voice recognition with accessibility
  const startListening = useCallback(async () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        speakText("Voice recognition is not supported in this browser.", 'high');
        toast.error("Speech recognition not supported");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = accessibilitySettings.physicalDisability;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        speakText("I'm listening", 'normal');
        triggerVibration([100]);
        toast.success("🎤 Listening...");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("🎤 Voice input:", transcript);
        
        // Check for voice commands for accessibility
        const lowerTranscript = transcript.toLowerCase();
        
        // Emergency voice commands
        if (voiceCommands.emergency.some(cmd => lowerTranscript.includes(cmd))) {
          setIsEmergency(true);
          speakText("Emergency mode activated. How can I help you?", 'high');
          triggerVibration([500, 200, 500, 200, 500]);
        }
        
        setInputText(transcript);
        handleAIInteraction(transcript, 'voice');
        setIsListening(false);
      };

      recognitionRef.current.onerror = (error) => {
        console.error("🚨 Speech recognition error:", error);
        speakText("Voice recognition error. Please try again.", 'high');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error("🚨 Voice recognition start error:", error);
      speakText("Could not start voice recognition. Please try typing instead.", 'high');
    }
  }, [accessibilitySettings, handleAIInteraction, speakText, triggerVibration]);

  // Enhanced camera with accessibility features
  const startVideo = useCallback(async () => {
    try {
      console.log("📹 Starting accessible camera...");
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
      
      speakText("Camera activated. I can now see your environment.", 'normal');
      toast.success("🎥 Camera activated for accessibility features!");
      
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
      speakText("Camera access denied. Please enable camera permissions for accessibility features.", 'high');
      toast.error("Camera access needed for visual assistance");
    }
  }, [accessibilitySettings, handleAIInteraction, speakText]);

  // Stop video
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

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Auto-play audio responses
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  // Accessibility announcements on mount
  useEffect(() => {
    const welcomeMessage = accessibilitySettings.isChild 
      ? "Hi there! I'm your friendly AI assistant. I'm here to help you with anything you need!"
      : accessibilitySettings.isElderly 
      ? "Hello, I'm your AI companion. I'm here to assist you and keep you company."
      : "Welcome to your accessible AI assistant. I'm here to help with all your needs.";
    
    if (accessibilitySettings.visualImpairment || accessibilitySettings.cognitiveSupport) {
      setTimeout(() => speakText(welcomeMessage, 'normal'), 1000);
    }
  }, [accessibilitySettings, speakText]);

  // File upload with accessibility
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    console.log("📁 Accessible file upload:", file.name, file.type);
    speakText("Processing your file, please wait.", 'normal');

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'document';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      
      const accessiblePrompt = accessibilitySettings.visualImpairment
        ? `Please describe this ${fileType} in great detail for someone who cannot see it. Include all people, objects, text, colors, and spatial relationships.`
        : `Please analyze this ${fileType} and tell me about it.`;
      
      await handleAIInteraction(
        accessiblePrompt, 
        fileType as any, 
        [{ type: fileType, data: base64Data, name: file.name }]
      );
    };
    reader.readAsDataURL(file);
  }, [accessibilitySettings, handleAIInteraction, speakText]);

  // Take accessible photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isVideoOn) {
      speakText("Please turn on the camera first", 'high');
      toast.error("Camera needed for photo");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          
          const accessiblePrompt = accessibilitySettings.visualImpairment
            ? "I just took a photo. Please describe everything you see in great detail - people, objects, surroundings, and help me understand my environment completely."
            : "I just took a photo. Please analyze what you see.";
            
          handleAIInteraction(
            accessiblePrompt, 
            'image', 
            [{ type: 'image', data: base64Data, name: 'accessibility-photo.jpg' }]
          );
        };
        reader.readAsDataURL(blob);
        speakText("Photo captured. Analyzing what I can see.", 'normal');
        toast.success("📸 Photo captured and analyzing...");
      }
    }, 'image/jpeg', 0.8);
  }, [isVideoOn, accessibilitySettings, handleAIInteraction, speakText]);

  // New Chat functionality
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
  }, []);

  // Load conversation
  const loadConversation = useCallback((conversationId: string) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConversationId(conversationId);
      setConversation(conv.messages);
      setIsSidebarOpen(false); // Close sidebar on mobile
      speakText(`Loaded conversation: ${conv.title}`, 'normal');
    }
  }, [conversationHistory]);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversationHistory(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      startNewChat();
    }
    speakText("Conversation deleted", 'normal');
    toast.success("Conversation deleted");
  }, [currentConversationId, startNewChat]);

  // Edit message functionality
  const startEditMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingText(content);
  }, []);

  const saveEditMessage = useCallback(async () => {
    if (!editingMessageId || !editingText.trim()) return;

    // Update the message
    setConversation(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, content: editingText.trim() }
        : msg
    ));

    // Resend to AI if it was a user message
    const message = conversation.find(m => m.id === editingMessageId);
    if (message?.type === 'user') {
      await handleAIInteraction(editingText.trim());
    }

    setEditingMessageId(null);
    setEditingText("");
    speakText("Message updated and resent", 'normal');
    toast.success("Message updated and resent");
  }, [editingMessageId, editingText, conversation, handleAIInteraction]);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText("");
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setConversation(prev => prev.filter(msg => msg.id !== messageId));
    speakText("Message deleted", 'normal');
    toast.success("Message deleted");
  }, []);

  return (
    <div className={`flex h-screen bg-white dark:bg-gray-900 ${
      accessibilitySettings.fontSize === 'large' ? 'text-lg' : 
      accessibilitySettings.fontSize === 'extra-large' ? 'text-xl' : 'text-base'
    }`}>
      {/* Enhanced Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50`}>
        {isSidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative z-50 bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button 
                    className="flex-1 justify-start bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    onClick={() => {
                      setConversation([]);
                      setCurrentConversationId(Date.now().toString());
                      speakText("New conversation started", 'normal');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden ml-2"
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
                        onClick={() => {
                          setCurrentConversationId(conv.id);
                          setConversation(conv.messages);
                          setIsSidebarOpen(false);
                          speakText(`Loaded conversation: ${conv.title}`, 'normal');
                        }}
                        className={`w-full text-left p-2 text-sm rounded-md truncate ${
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
                          className="h-6 w-6 p-0"
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

              {/* Accessibility Settings */}
              <div className="p-2 space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 dark:text-gray-300"
                  onClick={() => speakText("Accessibility settings available. You can adjust voice speed, font size, and enable features for visual, hearing, or cognitive support.", 'normal')}
                >
                  <Accessibility className="w-4 h-4 mr-2" />
                  Accessibility
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 dark:text-gray-300"
                  onClick={() => speakText("Settings menu. Configure your AI assistant preferences here.", 'normal')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with Accessibility Status */}
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-semibold text-gray-900 dark:text-white">Nurath.AI</div>
            
            {/* Accessibility Status Badges */}
            {accessibilitySettings.visualImpairment && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                <Eye className="w-3 h-3 mr-1" />
                Visual Support
              </Badge>
            )}
            {accessibilitySettings.hearingImpairment && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                <VolumeX className="w-3 h-3 mr-1" />
                Hearing Support
              </Badge>
            )}
            {accessibilitySettings.cognitiveSupport && (
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                <Brain className="w-3 h-3 mr-1" />
                Cognitive Support
              </Badge>
            )}
            {isEmergency && (
              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Emergency Mode
              </Badge>
            )}
            {currentEmotion && (
              <Badge variant="outline" className="border-pink-500/30 text-pink-400 bg-pink-500/10">
                <Heart className="w-3 h-3 mr-1" />
                {currentEmotion.primary}
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 animate-pulse">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            )}
            {isListening && (
              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 animate-pulse">
                <Mic className="w-3 h-3 mr-1" />
                Listening
              </Badge>
            )}
            {(isAudioCall || isVideoCall) && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 animate-pulse">
                {isVideoCall ? <Video className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                {isVideoCall ? 'Video Call' : 'Audio Call'}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {(isAudioCall || isVideoCall) && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  setIsAudioCall(false);
                  setIsVideoCall(false);
                  stopVideo();
                  stopListening();
                  setIsSpeaking(false);
                  speakText("Call ended", 'normal');
                  toast.info("Call ended");
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                End Call
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {conversation.length === 0 ? (
            // Welcome State with Accessibility Features
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-4xl">
                <h1 className={`font-bold text-gray-900 dark:text-white mb-8 ${
                  accessibilitySettings.fontSize === 'large' ? 'text-5xl' : 
                  accessibilitySettings.fontSize === 'extra-large' ? 'text-6xl' : 'text-4xl'
                }`}>
                  {accessibilitySettings.isChild ? "Hi! What can I help you with today?" :
                   accessibilitySettings.isElderly ? "Hello! I'm here to assist you." :
                   "What can I help you with?"}
                </h1>
                
                {/* Accessibility Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={() => handleAIInteraction("Please sing me a beautiful song with your voice and sing the actual lyrics", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">Sing Song</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Tell me what you can see around me and describe my environment", 'video')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">Describe Scene</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("I need emotional support and comfort right now", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Heart className="w-6 h-6" />
                    <span className="text-sm">Emotional Support</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Help me with my daily routine and remind me of important things", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">Daily Help</span>
                  </Button>
                  <Button
                    onClick={startVideo}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-sm">Start Camera</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Who is around me? Please recognize faces and tell me about people nearby", 'video')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Recognize People</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Generate a beautiful creative image for me", 'text')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Palette className="w-6 h-6" />
                    <span className="text-sm">Create Image</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEmergency(true);
                      handleAIInteraction("This is an emergency situation. I need help.", 'voice');
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 border-red-200 text-red-600"
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed for Accessibility */}
              {isVideoOn && (
                <div className="p-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 flex flex-wrap gap-2">
                      <Button onClick={takePhoto} size="sm" variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction("Describe my surroundings and tell me where I am in detail", 'video')}
                        size="sm" 
                        variant="outline"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Describe Location
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction("Who can you see around me? Please recognize faces and tell me about people", 'video')}
                        size="sm" 
                        variant="outline"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Recognize People
                      </Button>
                      <Button onClick={stopVideo} size="sm" variant="destructive">
                        <VideoOff className="w-4 h-4" />
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Chat Messages */}
              <div className="space-y-6 p-4">
                {conversation.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group relative ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    } rounded-lg px-4 py-2`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-white/20' 
                            : 'bg-blue-500'
                        }`}>
                          {message.type === 'user' ? <Users className="w-3 h-3 text-white" /> : <Brain className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-sm">
                          {message.type === 'user' ? 'You' : 'Nurath.AI'}
                        </span>
                        {message.hasAudio && (
                          <div className="flex items-center gap-1">
                            <Volume2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400">Voice</span>
                          </div>
                        )}
                        {message.accessibility?.audioDescription && accessibilitySettings.visualImpairment && (
                          <Badge variant="outline" className="text-xs">
                            <Accessibility className="w-3 h-3 mr-1" />
                            Audio Description
                          </Badge>
                        )}
                      </div>
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setConversation(prev => prev.map(msg => 
                                  msg.id === editingMessageId 
                                    ? { ...msg, content: editingText.trim() }
                                    : msg
                                ));
                                handleAIInteraction(editingText.trim());
                                setEditingMessageId(null);
                                setEditingText("");
                                speakText("Message updated and resent", 'normal');
                              }}
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                                className="max-w-full h-auto rounded-lg"
                              />
                            </div>
                          )}
                          {message.accessibility?.audioDescription && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Audio Description: {message.accessibility.audioDescription}
                            </div>
                          )}
                        </>
                      )}
                      
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>

                      {/* Message Actions */}
                      {message.type === 'user' && editingMessageId !== message.id && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditingText(message.content);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setConversation(prev => prev.filter(msg => msg.id !== message.id));
                              speakText("Message deleted", 'normal');
                            }}
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

        {/* Enhanced Input Area with Accessibility */}
        <div className="bg-white dark:bg-gray-900 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  accessibilitySettings.physicalDisability 
                    ? "Speak to me or type your message..."
                    : accessibilitySettings.speechImpairment
                    ? "Type your message here..."
                    : "Message Nurath.AI..."
                }
                className={`resize-none bg-transparent border-none px-4 py-3 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 ${
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
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Upload file for accessibility analysis"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isListening ? stopListening : startListening}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isVideoOn ? stopVideo : startVideo}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title={isVideoOn ? "Stop camera" : "Start camera for visual assistance"}
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
                  className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className={`text-gray-500 dark:text-gray-400 text-center mt-2 ${
              accessibilitySettings.fontSize === 'large' ? 'text-sm' : 'text-xs'
            }`}>
              Nurath.AI - Your accessible AI companion. Speak naturally or type your message.
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Elements */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default MultimodalAI;
