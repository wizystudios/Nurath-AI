
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Mic, 
  MicOff, 
  Upload, 
  Video, 
  VideoOff, 
  Phone,
  PhoneCall,
  Heart, 
  Brain, 
  Users,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Smile,
  Eye,
  Music,
  Scan,
  Send,
  Sparkles,
  BookOpen,
  Zap,
  Globe
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
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [inputText, setInputText] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [recognizedPeople, setRecognizedPeople] = useState<RelationshipTag[]>([]);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    attachments?: any[];
    hasAudio?: boolean;
  }>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-play audio responses
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  // Initialize camera/video
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoOn(true);
      toast.success("🎥 Camera activated! I can see you now!");
    } catch (error) {
      toast.error("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsVideoOn(false);
    toast.info("Camera stopped");
  }, []);

  // Voice recognition with better feedback
  const startListening = useCallback(async () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error("Speech recognition not supported in your browser");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("🎤 I'm listening... Speak now!");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleAIInteraction(transcript, 'voice');
        setIsListening(false);
      };

      recognition.onerror = () => {
        toast.error("Voice recognition error");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      toast.error("Could not start voice recognition");
    }
  }, []);

  // Enhanced AI Interaction with proper audio handling
  const handleAIInteraction = useCallback(async (input: string, mode: 'text' | 'voice' | 'image' | 'video' = 'text', attachments?: any[]) => {
    try {
      // Add user message to conversation
      setConversation(prev => [...prev, {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments
      }]);

      // Show typing indicator
      toast.loading("🧠 Nurath.AI is thinking...");

      // Call our multimodal AI edge function
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
        throw error;
      }

      const aiResponse: AIResponse = data;

      // Update states
      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
      }

      if (aiResponse.emotion) {
        setCurrentEmotion(aiResponse.emotion);
      }

      // Add AI response to conversation
      setConversation(prev => [...prev, {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl
      }]);

      // Play audio response with proper handling
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          audioRef.current.src = aiResponse.audioUrl;
          setIsSpeaking(true);
          await audioRef.current.play();
          toast.success("🔊 Playing voice response");
        } catch (audioError) {
          console.error('Audio playback error:', audioError);
          toast.error("Audio playback failed");
          setIsSpeaking(false);
        }
      }

      // Show environment description
      if (aiResponse.environmentDescription) {
        toast.info(`🌍 ${aiResponse.environmentDescription}`);
      }

    } catch (error) {
      console.error('AI interaction error:', error);
      toast.error("Sorry, I'm having trouble. Please try again.");
    }
  }, [isVideoOn, recognizedPeople, currentEmotion, conversation]);

  // Quick action handlers
  const handleEmotionCheck = useCallback(async () => {
    if (!isVideoOn) {
      await startVideo();
      setTimeout(() => captureForEmotion(), 1000);
    } else {
      captureForEmotion();
    }
  }, [isVideoOn, startVideo]);

  const captureForEmotion = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    
    await handleAIInteraction(
      "Analyze my emotions from this photo. How am I feeling?", 
      'image', 
      [{ type: 'image', data: imageData, name: 'emotion_check.jpg' }]
    );
  }, [handleAIInteraction]);

  const handleEnvironmentScan = useCallback(async () => {
    if (!isVideoOn) {
      await startVideo();
      setTimeout(() => captureEnvironment(), 1000);
    } else {
      captureEnvironment();
    }
  }, [isVideoOn, startVideo]);

  const captureEnvironment = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    
    await handleAIInteraction(
      "Scan and describe my environment. What do you see around me?", 
      'image', 
      [{ type: 'image', data: imageData, name: 'environment_scan.jpg' }]
    );
  }, [handleAIInteraction]);

  // Voice-based quick actions
  const handleSingSong = () => {
    handleAIInteraction("Sing me a beautiful song with your voice", 'voice');
  };

  const handleTellJoke = () => {
    handleAIInteraction("Tell me a funny joke using your voice", 'voice');
  };

  const handleTellStory = () => {
    handleAIInteraction("Tell me an interesting story using your voice", 'voice');
  };

  const startVideoCall = () => {
    setIsVideoCall(true);
    startVideo();
    handleAIInteraction("Hello! Let's have a video call conversation", 'voice');
  };

  const startAudioCall = () => {
    handleAIInteraction("Hello! Let's have an audio call conversation", 'voice');
  };

  // File upload handlers
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'document';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      await handleAIInteraction(
        `Please analyze this ${fileType} and tell me about it`, 
        fileType as any, 
        [{ type: fileType, data: base64Data, name: file.name }]
      );
    };
    reader.readAsDataURL(file);
  }, [handleAIInteraction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Modern Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Brain className="w-8 h-8 text-white animate-pulse" />
                </div>
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                )}
                {isListening && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Nurath.AI
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Your Intelligent World Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {currentEmotion && (
                <Badge className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700 animate-fade-in">
                  <Heart className="w-3 h-3 mr-1 animate-pulse" />
                  {currentEmotion.primary} ({Math.round(currentEmotion.confidence * 100)}%)
                </Badge>
              )}
              
              {recognizedPeople.length > 0 && (
                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                  <Users className="w-3 h-3 mr-1" />
                  {recognizedPeople.length} people recognized
                </Badge>
              )}

              {isSpeaking && (
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking
                </Badge>
              )}

              {isVideoCall && (
                <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 animate-pulse">
                  <Video className="w-3 h-3 mr-1" />
                  Video Call Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Video Feed */}
            {isVideoOn && (
              <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-r from-slate-800 to-slate-900 relative">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-80 object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-xl" />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <Button
                          onClick={captureForEmotion}
                          size="sm"
                          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg backdrop-blur-sm"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Check Emotion
                        </Button>
                        <Button
                          onClick={captureEnvironment}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg backdrop-blur-sm"
                        >
                          <Scan className="w-4 h-4 mr-2" />
                          Scan Area
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={startVideoCall}
                          size="sm"
                          variant={isVideoCall ? "destructive" : "secondary"}
                          className="shadow-lg backdrop-blur-sm"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={stopVideo}
                          size="sm"
                          variant="destructive"
                          className="shadow-lg backdrop-blur-sm"
                        >
                          <VideoOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation Area */}
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {conversation.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                        <Brain className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Welcome to Nurath.AI ✨
                      </h2>
                      <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                        Your intelligent world assistant! I can see, hear, understand emotions, recognize faces, 
                        and provide real-time assistance with voice responses. Let's start our conversation!
                      </p>
                    </div>
                  ) : (
                    conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div className={`max-w-[85%] ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl' 
                            : 'bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700'
                        } rounded-2xl p-5 relative`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-white/20 backdrop-blur-sm' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}>
                              {message.type === 'user' ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                <Brain className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-lg">
                                {message.type === 'user' ? 'You' : 'Nurath.AI'}
                              </span>
                              {message.hasAudio && (
                                <Volume2 className="w-4 h-4 text-green-500 ml-2 inline animate-pulse" />
                              )}
                            </div>
                          </div>
                          <p className="mb-3 leading-relaxed">{message.content}</p>
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Enhanced Input Area */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
                  <div className="space-y-4">
                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={handleSingSong}
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Sing Song 🎵
                      </Button>
                      <Button
                        onClick={handleTellJoke}
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                      >
                        <Smile className="w-4 h-4 mr-2" />
                        Tell Joke 😄
                      </Button>
                      <Button
                        onClick={handleTellStory}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Tell Story 📚
                      </Button>
                      <Button
                        onClick={handleEmotionCheck}
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Check Emotion 💝
                      </Button>
                      <Button
                        onClick={handleEnvironmentScan}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Scan Area 👁️
                      </Button>
                    </div>

                    {/* Input Controls */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="💬 Ask me anything, share your feelings, or just say hello..."
                          className="min-h-[80px] resize-none border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-lg"
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
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={isListening ? "destructive" : "secondary"}
                            onClick={isListening ? () => setIsListening(false) : startListening}
                            className="shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={isVideoOn ? "destructive" : "secondary"}
                            onClick={isVideoOn ? stopVideo : startVideo}
                            className="shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Upload className="w-5 h-5" />
                          </Button>
                        </div>

                        <Button
                          onClick={() => {
                            if (inputText.trim()) {
                              handleAIInteraction(inputText);
                              setInputText("");
                            }
                          }}
                          disabled={!inputText.trim()}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                          <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                          Send
                          <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Call Actions */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                  Voice & Video Calls
                </h3>
                <div className="space-y-3">
                  <Button 
                    onClick={startVideoCall}
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Video className="w-5 h-5 mr-3" />
                    Start Video Call 📹
                  </Button>
                  <Button 
                    onClick={startAudioCall}
                    className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    Start Audio Call 📞
                  </Button>
                </div>
              </div>
            </Card>

            {/* Entertainment Actions */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Entertainment
                </h3>
                <div className="space-y-3">
                  <Button 
                    onClick={handleSingSong}
                    className="w-full justify-start bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Music className="w-5 h-5 mr-3" />
                    Sing Me a Song 🎵
                  </Button>
                  <Button 
                    onClick={handleTellJoke}
                    className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Smile className="w-5 h-5 mr-3" />
                    Tell Me a Joke 😄
                  </Button>
                  <Button 
                    onClick={handleTellStory}
                    className="w-full justify-start bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    Tell Me a Story 📚
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recognition & Analysis */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-green-600" />
                  Smart Analysis
                </h3>
                <div className="space-y-3">
                  <Button 
                    onClick={handleEmotionCheck}
                    className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Check My Emotions 💝
                  </Button>
                  <Button 
                    onClick={handleEnvironmentScan}
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Eye className="w-5 h-5 mr-3" />
                    Scan Environment 🌍
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recognized People */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Recognized People
                </h3>
                {recognizedPeople.length > 0 ? (
                  <div className="space-y-4">
                    {recognizedPeople.map((person) => (
                      <div key={person.id} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border border-indigo-200 dark:border-indigo-700">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {person.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{person.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{person.relationship}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      No people recognized yet. Show me photos of your family and friends so I can remember them!
                    </p>
                  </div>
                )}
              </div>
            </Card>
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
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <audio ref={audioRef} preload="auto" />

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
};

export default MultimodalAI;
