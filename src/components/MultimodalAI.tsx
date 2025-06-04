
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
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RelationshipTag {
  id: string;
  name: string;
  relationship: string;
  imageUrl?: string;
}

interface EmotionState {
  primary: string;
  confidence: number;
  tone: 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'confused';
}

interface AIResponse {
  text: string;
  audioUrl?: string;
  emotion?: EmotionState;
  recognizedFaces?: RelationshipTag[];
  environmentDescription?: string;
  suggestions?: string[];
  imageUrl?: string;
}

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
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [inputText, setInputText] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [recognizedPeople, setRecognizedPeople] = useState<RelationshipTag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    date: string;
    messages: ConversationMessage[];
  }>>([
    {
      id: '1',
      title: 'AI Voice and Emotion Interaction',
      date: 'Today',
      messages: []
    },
    {
      id: '2', 
      title: 'Telehealth App Requirements',
      date: 'Today',
      messages: []
    },
    {
      id: '3',
      title: 'TunzaTech E-Waste Solution',
      date: 'Yesterday',
      messages: []
    }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('1');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-play audio responses
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  // Initialize camera/video with better error handling
  const startVideo = useCallback(async () => {
    try {
      console.log("Attempting to start camera...");
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
      toast.success("🎥 Camera activated! I can see you now!");
      
      // Automatically scan environment when camera starts
      setTimeout(() => {
        handleAIInteraction("I can see you now! Let me analyze what's in your environment and tell you about your surroundings in detail.", 'video');
      }, 1000);
      
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Camera access denied. Please enable camera permissions in your browser settings.");
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    toast.info("Camera stopped");
  }, []);

  // Enhanced voice recognition with better error handling
  const startListening = useCallback(async () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error("Speech recognition not supported in your browser");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast.success("🎤 I'm listening... Speak now!");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input received:", transcript);
        setInputText(transcript);
        handleAIInteraction(transcript, 'voice');
        setIsListening(false);
      };

      recognitionRef.current.onerror = (error) => {
        console.error("Speech recognition error:", error);
        toast.error("Voice recognition error. Please try again.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error("Could not start voice recognition:", error);
      toast.error("Could not start voice recognition");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Enhanced AI Interaction with better error handling
  const handleAIInteraction = useCallback(async (input: string, mode: 'text' | 'voice' | 'image' | 'video' = 'text', attachments?: any[]) => {
    try {
      console.log("Starting AI interaction:", { input, mode, attachments: attachments?.length || 0 });
      
      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments,
        id: Date.now().toString()
      };

      setConversation(prev => [...prev, newMessage]);

      toast.loading("🧠 Nurath.AI is thinking...");

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode,
          attachments,
          videoEnabled: isVideoOn,
          context: {
            recognizedPeople,
            currentEmotion,
            conversationHistory: conversation.slice(-5)
          }
        }
      });

      toast.dismiss();

      if (error) {
        console.error('AI Error:', error);
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          toast.error("🚫 OpenAI API quota exceeded. Please check your API key billing status.");
          const errorMessage: ConversationMessage = {
            type: 'ai',
            content: "I'm sorry, but my voice capabilities are temporarily unavailable due to API quota limits. My creator needs to check the OpenAI billing settings. I can still chat with you through text!",
            timestamp: new Date(),
            hasAudio: false,
            id: Date.now().toString()
          };
          setConversation(prev => [...prev, errorMessage]);
          return;
        }
        throw error;
      }

      const aiResponse: AIResponse = data;

      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
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
        imageUrl: aiResponse.imageUrl
      };

      setConversation(prev => [...prev, aiMessage]);

      // Handle audio response - REAL VOICE
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          audioRef.current.src = aiResponse.audioUrl;
          setIsSpeaking(true);
          await audioRef.current.play();
          toast.success("🔊 Playing voice response");
        } catch (audioError) {
          console.error('Audio playback error:', audioError);
          toast.error("Audio playback failed - please check browser audio permissions");
          setIsSpeaking(false);
        }
      }

      if (aiResponse.environmentDescription) {
        toast.info(`🌍 ${aiResponse.environmentDescription}`);
      }

    } catch (error) {
      console.error('AI interaction error:', error);
      toast.error("Sorry, I'm having trouble. Please try again.");
      
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: "I apologize, but I'm experiencing technical difficulties. Please ensure you have a stable internet connection and try again.",
        timestamp: new Date(),
        hasAudio: false,
        id: Date.now().toString()
      };
      setConversation(prev => [...prev, errorMessage]);
    }
  }, [isVideoOn, recognizedPeople, currentEmotion, conversation]);

  // Enhanced file upload with image recognition
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    console.log("File uploaded:", file.name, file.type);

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'document';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      console.log("File converted to base64, size:", base64Data.length);
      
      await handleAIInteraction(
        `Please analyze this ${fileType} and tell me about it in detail. If it's an image, describe what you see. If it contains people, try to recognize them and tell me about the environment and surroundings.`, 
        fileType as any, 
        [{ type: fileType, data: base64Data, name: file.name }]
      );
    };
    reader.readAsDataURL(file);
  }, [handleAIInteraction]);

  // Take photo from camera
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isVideoOn) {
      toast.error("Please turn on the camera first");
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
          handleAIInteraction(
            "I just took a photo. Please analyze what you see, recognize any people, describe the environment and surroundings in detail.", 
            'image', 
            [{ type: 'image', data: base64Data, name: 'camera-photo.jpg' }]
          );
        };
        reader.readAsDataURL(blob);
        toast.success("📸 Photo captured and analyzing...");
      }
    }, 'image/jpeg', 0.8);
  }, [isVideoOn, handleAIInteraction]);

  // Start Audio Call
  const startAudioCall = useCallback(async () => {
    try {
      setIsAudioCall(true);
      toast.success("📞 Starting audio call with Nurath.AI...");
      await handleAIInteraction("Hello! I'm starting an audio call with you. Please respond with your voice and let's have a real conversation!", 'voice');
    } catch (error) {
      console.error("Audio call error:", error);
      toast.error("Failed to start audio call");
      setIsAudioCall(false);
    }
  }, [handleAIInteraction]);

  // Start Video Call
  const startVideoCall = useCallback(async () => {
    try {
      setIsVideoCall(true);
      await startVideo();
      toast.success("📹 Starting video call with Nurath.AI...");
      await handleAIInteraction("Hello! I'm starting a video call with you. I can see you now through the camera. Please respond with your voice and let's have a real face-to-face conversation!", 'video');
    } catch (error) {
      console.error("Video call error:", error);
      toast.error("Failed to start video call");
      setIsVideoCall(false);
    }
  }, [startVideo, handleAIInteraction]);

  // End calls
  const endCall = useCallback(() => {
    setIsAudioCall(false);
    setIsVideoCall(false);
    stopVideo();
    stopListening();
    setIsSpeaking(false);
    toast.info("Call ended");
  }, [stopVideo, stopListening]);

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
    toast.success("Started new conversation");
  }, []);

  // Load conversation
  const loadConversation = useCallback((conversationId: string) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConversationId(conversationId);
      setConversation(conv.messages);
      setIsSidebarOpen(false); // Close sidebar on mobile
    }
  }, [conversationHistory]);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversationHistory(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      startNewChat();
    }
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
    toast.success("Message updated and resent");
  }, [editingMessageId, editingText, conversation, handleAIInteraction]);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText("");
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setConversation(prev => prev.filter(msg => msg.id !== messageId));
    toast.success("Message deleted");
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50`}>
        {isSidebarOpen && (
          <>
            {/* Mobile overlay */}
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            
            <div className="relative z-50 bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button 
                    className="flex-1 justify-start bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    onClick={startNewChat}
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
                        onClick={() => loadConversation(conv.id)}
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
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-2 space-y-1">
                <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300">
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
        {/* Top Header */}
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
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600"
              >
                End Call
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
              <Share className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {conversation.length === 0 ? (
            // Welcome State
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                  What can I help you with?
                </h1>
                
                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <Button
                    onClick={() => handleAIInteraction("Sing me a beautiful song with your voice and sing the actual lyrics", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">Sing Song</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Tell me a funny joke using your voice", 'voice')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Smile className="w-6 h-6" />
                    <span className="text-sm">Tell Joke</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction("Generate a creative beautiful image for me", 'text')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Palette className="w-6 h-6" />
                    <span className="text-sm">Generate Image</span>
                  </Button>
                  <Button
                    onClick={startVideoCall}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-sm">Video Call</span>
                  </Button>
                  <Button
                    onClick={startAudioCall}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <PhoneCall className="w-6 h-6" />
                    <span className="text-sm">Audio Call</span>
                  </Button>
                  <Button
                    onClick={startVideo}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">Recognize & Scan</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed */}
              {isVideoOn && (
                <div className="p-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 flex space-x-2">
                      <Button onClick={takePhoto} size="sm" variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction("Look around and tell me where I am and describe my surroundings in detail", 'video')}
                        size="sm" 
                        variant="outline"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Scan Location
                      </Button>
                      <Button onClick={stopVideo} size="sm" variant="destructive">
                        <VideoOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
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
                      </div>
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={saveEditMessage}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.imageUrl && (
                            <div className="mt-2">
                              <img 
                                src={message.imageUrl} 
                                alt="Generated content" 
                                className="max-w-full h-auto rounded-lg"
                              />
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
                            onClick={() => startEditMessage(message.id, message.content)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
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
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message Nurath.AI..."
                className="min-h-[60px] resize-none bg-transparent border-none px-4 py-3 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
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
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isListening ? stopListening : startListening}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isVideoOn ? stopVideo : startVideo}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Nurath.AI can make mistakes. Check important info.
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
