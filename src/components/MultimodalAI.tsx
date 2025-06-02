
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
  Settings,
  Paperclip,
  MessageSquare
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

  const quickActions = [
    { name: "Build a mobile app with Expo", icon: "📱" },
    { name: "Start a blog with Astro", icon: "📝" },
    { name: "Create a docs site with Vitepress", icon: "📚" },
    { name: "Scaffold UI with shadcn", icon: "🎨" },
    { name: "Draft a presentation with Slidev", icon: "📊" }
  ];

  const techStacks = [
    { name: "Angular", icon: "🅰️" },
    { name: "Vue", icon: "💚" },
    { name: "Nuxt", icon: "🔷" },
    { name: "Next.js", icon: "⚫" },
    { name: "Astro", icon: "🚀" },
    { name: "SvelteKit", icon: "🧡" },
    { name: "Remix", icon: "💿" },
    { name: "SolidStart", icon: "🔵" },
    { name: "Qwik", icon: "⚡" },
    { name: "Laravel", icon: "🔴" },
    { name: "Django", icon: "🐍" },
    { name: "Flask", icon: "🌶️" },
    { name: "Spring", icon: "🍃" },
    { name: "Express", icon: "🚂" },
    { name: "Fastify", icon: "⚡" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Top Navigation - Bolt Style */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-white font-bold text-xl">Nurath.AI</div>
              {currentEmotion && (
                <Badge className="bg-pink-600/20 text-pink-300 border-pink-600/30">
                  <Heart className="w-3 h-3 mr-1" />
                  {currentEmotion.primary}
                </Badge>
              )}
              {isSpeaking && (
                <Badge className="bg-green-600/20 text-green-300 border-green-600/30 animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        {conversation.length === 0 ? (
          // Bolt.new Style Welcome Screen
          <div className="max-w-4xl w-full text-center">
            <div className="mb-6">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                What do you want to build?
              </h1>
              <p className="text-lg text-slate-400 mb-8">
                Prompt, run, edit, and deploy full-stack <span className="text-white font-semibold">web</span> and <span className="text-white font-semibold">mobile</span> apps.
              </p>
            </div>

            {/* Input Area - Bolt Style */}
            <div className="mb-12">
              <div className="relative max-w-3xl mx-auto">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="How can Nurath.AI help you today?"
                  className="w-full min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 rounded-lg p-4 pr-16 resize-none text-base"
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
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-400 hover:text-white p-2"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={isListening ? "destructive" : "ghost"}
                    onClick={isListening ? () => setIsListening(false) : startListening}
                    className="text-slate-400 hover:text-white p-2"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => {
                    if (inputText.trim()) {
                      handleAIInteraction(inputText);
                      setInputText("");
                    }
                  }}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>

            {/* Import Options */}
            <div className="mb-12">
              <p className="text-slate-400 text-sm mb-4">or import from</p>
              <div className="flex items-center justify-center space-x-4">
                <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:text-white">
                  <span className="mr-2">🎨</span> Figma
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:text-white">
                  <span className="mr-2">⚫</span> GitHub
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIInteraction(action.name)}
                    className="bg-slate-800/30 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/50 text-sm"
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tech Stack Icons */}
            <div className="mb-12">
              <p className="text-slate-400 text-sm mb-6">or start a blank app with your favorite stack</p>
              <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
                {techStacks.map((tech, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIInteraction(`Create a new project with ${tech.name}`)}
                    className="w-12 h-12 rounded-lg bg-slate-800/30 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/50 p-0"
                    title={tech.name}
                  >
                    <span className="text-lg">{tech.icon}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
              <Button
                onClick={handleSingSong}
                variant="outline"
                size="sm"
                className="bg-pink-600/10 border-pink-600/30 text-pink-300 hover:bg-pink-600/20"
              >
                <Music className="w-4 h-4 mr-2" />
                Sing Song
              </Button>
              <Button
                onClick={handleTellJoke}
                variant="outline"
                size="sm"
                className="bg-yellow-600/10 border-yellow-600/30 text-yellow-300 hover:bg-yellow-600/20"
              >
                <Smile className="w-4 h-4 mr-2" />
                Tell Joke
              </Button>
              <Button
                onClick={handleTellStory}
                variant="outline"
                size="sm"
                className="bg-purple-600/10 border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Tell Story
              </Button>
              <Button
                onClick={handleEmotionCheck}
                variant="outline"
                size="sm"
                className="bg-green-600/10 border-green-600/30 text-green-300 hover:bg-green-600/20"
              >
                <Heart className="w-4 h-4 mr-2" />
                Emotion
              </Button>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="max-w-4xl w-full">
            {/* Video Feed */}
            {isVideoOn && (
              <Card className="bg-slate-800/50 border-slate-700 mb-6">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button onClick={captureForEmotion} size="sm" className="bg-pink-600 hover:bg-pink-700">
                        <Heart className="w-4 h-4 mr-2" />
                        Emotion
                      </Button>
                      <Button onClick={captureEnvironment} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Scan className="w-4 h-4 mr-2" />
                        Scan
                      </Button>
                    </div>
                    <Button onClick={stopVideo} size="sm" variant="destructive">
                      <VideoOff className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation */}
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-100'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {message.type === 'user' ? <Users className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                          <span className="font-medium text-sm">
                            {message.type === 'user' ? 'You' : 'Nurath.AI'}
                          </span>
                          {message.hasAudio && <Volume2 className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-2 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Input Area */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Continue the conversation..."
                      className="min-h-[60px] resize-none bg-slate-700 border-slate-600 text-white placeholder-slate-400"
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
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isVideoOn ? "destructive" : "secondary"}
                      onClick={isVideoOn ? stopVideo : startVideo}
                    >
                      {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
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
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center space-x-4">
              <span>We're hiring! •</span>
              <span>Help Center</span>
              <span>Pricing</span>
              <span>Terms</span>
              <span>Privacy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>StackBlitz</span>
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
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default MultimodalAI;
