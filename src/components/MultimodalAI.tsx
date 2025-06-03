
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Zap
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

  // Voice recognition
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

  // AI Interaction
  const handleAIInteraction = useCallback(async (input: string, mode: 'text' | 'voice' | 'image' | 'video' = 'text', attachments?: any[]) => {
    try {
      setConversation(prev => [...prev, {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments
      }]);

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
        throw error;
      }

      const aiResponse: AIResponse = data;

      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
      }

      if (aiResponse.emotion) {
        setCurrentEmotion(aiResponse.emotion);
      }

      setConversation(prev => [...prev, {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl
      }]);

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

      if (aiResponse.environmentDescription) {
        toast.info(`🌍 ${aiResponse.environmentDescription}`);
      }

    } catch (error) {
      console.error('AI interaction error:', error);
      toast.error("Sorry, I'm having trouble. Please try again.");
    }
  }, [isVideoOn, recognizedPeople, currentEmotion, conversation]);

  // File upload
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
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col">
      {/* Header - minimal like Bolt */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#1e1e1e] border-b border-gray-800/50">
        <div className="flex items-center space-x-4">
          <div className="text-white font-bold text-xl">Nurath.AI</div>
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
        </div>
      </header>

      {/* Main Content - Exact Bolt Layout */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        {conversation.length === 0 ? (
          <div className="w-full max-w-2xl text-center space-y-12">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-tight">
                What can I help you with?
              </h1>
              <p className="text-lg text-gray-400">
                Voice conversations, emotion detection, environment scanning, and smart AI assistance.
              </p>
            </div>

            {/* Main Input Area - 3D like Bolt */}
            <div className="space-y-6">
              <div className="relative">
                <div className="bg-[#2a2a2a] border border-gray-600/50 rounded-xl p-1 shadow-2xl">
                  <div className="bg-[#1a1a1a] rounded-lg border border-gray-700/30 p-4">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask Nurath.AI anything..."
                      className="w-full min-h-[80px] bg-transparent border-none text-white placeholder-gray-500 resize-none text-lg focus:outline-none focus:ring-0"
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
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={isListening ? "destructive" : "ghost"}
                          onClick={isListening ? () => setIsListening(false) : startListening}
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid - Semi-rounded like Bolt */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => handleAIInteraction("Sing me a beautiful song with your voice", 'voice')}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-sm">Sing Song</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Tell me a funny joke using your voice", 'voice')}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Smile className="w-5 h-5" />
                  <span className="text-sm">Tell Joke</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Tell me an interesting story using your voice", 'voice')}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm">Tell Story</span>
                </Button>
                <Button
                  onClick={startVideo}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">Emotion</span>
                </Button>
              </div>

              {/* Main Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleAIInteraction("Let's have a voice conversation", 'voice')}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-3 flex items-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Voice Chat</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Scan my environment and tell me what you see", 'image')}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-3 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Environment Scan</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Help me with smart AI assistance")}
                  variant="outline"
                  className="bg-[#2a2a2a] border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/50 rounded-lg p-3 flex items-center space-x-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>Smart Assistant</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="max-w-4xl w-full">
            {/* Video Feed */}
            {isVideoOn && (
              <Card className="bg-gray-800/50 border-gray-700 mb-6 rounded-lg">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-pink-600 hover:bg-pink-700 rounded-lg">
                        <Heart className="w-4 h-4 mr-2" />
                        Emotion
                      </Button>
                    </div>
                    <Button onClick={stopVideo} size="sm" variant="destructive" className="rounded-lg">
                      <VideoOff className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation */}
            <Card className="bg-gray-800/50 border-gray-700 mb-6 rounded-lg">
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'bg-gray-700/50 text-gray-100'
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
            <Card className="bg-gray-800/50 border-gray-700 rounded-lg">
              <CardContent className="p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Continue the conversation..."
                      className="min-h-[60px] resize-none bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 rounded-lg"
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
                      className="rounded-lg"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isVideoOn ? "destructive" : "secondary"}
                      onClick={isVideoOn ? stopVideo : startVideo}
                      className="rounded-lg"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
