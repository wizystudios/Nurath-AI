
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
  Globe,
  Play,
  Pause,
  Settings
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navigation Bar - Bolt Style */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Nurath.AI</h1>
                <p className="text-xs text-slate-400">Intelligent World Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {currentEmotion && (
                <Badge className="bg-pink-600/20 text-pink-300 border-pink-600/30">
                  <Heart className="w-3 h-3 mr-1" />
                  {currentEmotion.primary}
                </Badge>
              )}
              
              {recognizedPeople.length > 0 && (
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                  <Users className="w-3 h-3 mr-1" />
                  {recognizedPeople.length} people
                </Badge>
              )}

              {isSpeaking && (
                <Badge className="bg-green-600/20 text-green-300 border-green-600/30 animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Feed */}
            {isVideoOn && (
              <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          onClick={captureForEmotion}
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Emotion
                        </Button>
                        <Button
                          onClick={captureEnvironment}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Scan className="w-4 h-4 mr-2" />
                          Scan
                        </Button>
                      </div>
                      
                      <Button
                        onClick={stopVideo}
                        size="sm"
                        variant="destructive"
                      >
                        <VideoOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation Area */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-4 text-white">
                        What do you want to build?
                      </h2>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Prompt, run, edit, and deploy your intelligent AI assistant with voice, vision, and emotion recognition.
                      </p>
                    </div>
                  ) : (
                    conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        } rounded-lg p-4`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-white/20' 
                                : 'bg-blue-600'
                            }`}>
                              {message.type === 'user' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <Brain className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="font-medium text-sm">
                              {message.type === 'user' ? 'You' : 'Nurath.AI'}
                            </span>
                            {message.hasAudio && (
                              <Volume2 className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <span className="text-xs opacity-70 mt-2 block">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-700 p-6 bg-slate-900/30">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button onClick={handleSingSong} size="sm" className="bg-pink-600/20 text-pink-300 border-pink-600/30 hover:bg-pink-600/30">
                      <Music className="w-4 h-4 mr-2" />
                      Sing Song
                    </Button>
                    <Button onClick={handleTellJoke} size="sm" className="bg-yellow-600/20 text-yellow-300 border-yellow-600/30 hover:bg-yellow-600/30">
                      <Smile className="w-4 h-4 mr-2" />
                      Tell Joke
                    </Button>
                    <Button onClick={handleTellStory} size="sm" className="bg-purple-600/20 text-purple-300 border-purple-600/30 hover:bg-purple-600/30">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Tell Story
                    </Button>
                    <Button onClick={handleEmotionCheck} size="sm" className="bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30">
                      <Heart className="w-4 h-4 mr-2" />
                      Check Emotion
                    </Button>
                    <Button onClick={handleEnvironmentScan} size="sm" className="bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30">
                      <Eye className="w-4 h-4 mr-2" />
                      Scan Area
                    </Button>
                  </div>

                  {/* Input Controls */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="How can Nurath.AI help you today?"
                        className="min-h-[60px] resize-none bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
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

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isListening ? "destructive" : "secondary"}
                        onClick={isListening ? () => setIsListening(false) : startListening}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={isVideoOn ? "destructive" : "secondary"}
                        onClick={isVideoOn ? stopVideo : startVideo}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                      >
                        {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={() => {
                          if (inputText.trim()) {
                            handleAIInteraction(inputText);
                            setInputText("");
                          }
                        }}
                        disabled={!inputText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Call Actions */}
            <Card className="bg-slate-900/50 border-slate-700">
              <div className="p-4">
                <h3 className="font-semibold text-white mb-3 text-sm">Voice & Video</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={startVideoCall}
                    className="w-full justify-start bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30 text-sm"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video Call
                  </Button>
                  <Button 
                    onClick={startAudioCall}
                    className="w-full justify-start bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30 text-sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Audio Call
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recognition Status */}
            <Card className="bg-slate-900/50 border-slate-700">
              <div className="p-4">
                <h3 className="font-semibold text-white mb-3 text-sm">Recognition</h3>
                {recognizedPeople.length > 0 ? (
                  <div className="space-y-2">
                    {recognizedPeople.map((person) => (
                      <div key={person.id} className="flex items-center gap-3 p-2 rounded bg-slate-800/50">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                          {person.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{person.name}</p>
                          <p className="text-slate-400 text-xs">{person.relationship}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No people recognized yet</p>
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
    </div>
  );
};

export default MultimodalAI;
