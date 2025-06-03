
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
  MessageSquare,
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
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="text-white font-semibold text-lg">Nurath.AI</div>
          {currentEmotion && (
            <Badge variant="outline" className="border-pink-500/30 text-pink-400">
              <Heart className="w-3 h-3 mr-1" />
              {currentEmotion.primary}
            </Badge>
          )}
          {isSpeaking && (
            <Badge variant="outline" className="border-green-500/30 text-green-400 animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" />
              Speaking
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            Sign In
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Get Started
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-6">
        {conversation.length === 0 ? (
          // Welcome Screen - Exact Bolt.new Style
          <div className="max-w-4xl w-full text-center">
            {/* Hackathon Banner */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-4">Join the world's largest hackathon!</p>
            </div>

            {/* Main Heading */}
            <div className="mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                What do you want to build?
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Prompt, run, edit, and deploy full-stack <span className="text-white font-medium">web</span> and <span className="text-white font-medium">mobile</span> apps.
              </p>
            </div>

            {/* Input Area */}
            <div className="mb-12">
              <div className="relative max-w-3xl mx-auto">
                <div className="bg-[#2d2d2d] border border-gray-700 rounded-lg p-6">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="How can Nurath.AI help you today?"
                    className="w-full min-h-[100px] bg-transparent border-none text-white placeholder-gray-500 resize-none text-base focus:outline-none"
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
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-400 hover:text-white p-2"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isListening ? "destructive" : "ghost"}
                        onClick={isListening ? () => setIsListening(false) : startListening}
                        className="text-gray-400 hover:text-white p-2"
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Options */}
            <div className="mb-12">
              <p className="text-sm text-gray-500 mb-6">or import from</p>
              <div className="flex items-center justify-center space-x-6">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <span className="mr-2 text-lg">🎨</span> Figma
                </Button>
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <span className="mr-2 text-lg">⚫</span> GitHub
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIInteraction(action.name)}
                    className="bg-transparent border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="mb-12">
              <p className="text-sm text-gray-500 mb-8">or start a blank app with your favorite stack</p>
              <div className="grid grid-cols-8 gap-4 max-w-2xl mx-auto mb-8">
                {techStacks.slice(0, 16).map((tech, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIInteraction(`Create a new project with ${tech.name}`)}
                    className="w-12 h-12 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 p-0"
                    title={tech.name}
                  >
                    <span className="text-lg">{tech.icon}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <Button
                onClick={() => handleAIInteraction("Sing me a beautiful song with your voice", 'voice')}
                variant="outline"
                size="sm"
                className="bg-transparent border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
              >
                <Music className="w-4 h-4 mr-2" />
                Sing Song
              </Button>
              <Button
                onClick={() => handleAIInteraction("Tell me a funny joke using your voice", 'voice')}
                variant="outline"
                size="sm"
                className="bg-transparent border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Smile className="w-4 h-4 mr-2" />
                Tell Joke
              </Button>
              <Button
                onClick={() => handleAIInteraction("Tell me an interesting story using your voice", 'voice')}
                variant="outline"
                size="sm"
                className="bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Tell Story
              </Button>
              <Button
                onClick={startVideo}
                variant="outline"
                size="sm"
                className="bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10"
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
              <Card className="bg-[#2d2d2d] border-gray-700 mb-6">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                        <Heart className="w-4 h-4 mr-2" />
                        Emotion
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
            <Card className="bg-[#2d2d2d] border-gray-700 mb-6">
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-100'
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
            <Card className="bg-[#2d2d2d] border-gray-700">
              <CardContent className="p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Continue the conversation..."
                      className="min-h-[60px] resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
      <footer className="border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-6">
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
      </footer>

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
