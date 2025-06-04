import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MapPin
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
        console.log("Voice input received:", transcript);
        setInputText(transcript);
        handleAIInteraction(transcript, 'voice');
        setIsListening(false);
      };

      recognition.onerror = (error) => {
        console.error("Speech recognition error:", error);
        toast.error("Voice recognition error. Please try again.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Could not start voice recognition:", error);
      toast.error("Could not start voice recognition");
    }
  }, []);

  // Enhanced AI Interaction with better error handling
  const handleAIInteraction = useCallback(async (input: string, mode: 'text' | 'voice' | 'image' | 'video' = 'text', attachments?: any[]) => {
    try {
      console.log("Starting AI interaction:", { input, mode, attachments: attachments?.length || 0 });
      
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
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          toast.error("🚫 OpenAI API quota exceeded. Please check your API key billing status.");
          setConversation(prev => [...prev, {
            type: 'ai',
            content: "I'm sorry, but my voice capabilities are temporarily unavailable due to API quota limits. My creator needs to check the OpenAI billing settings. I can still chat with you through text!",
            timestamp: new Date(),
            hasAudio: false
          }]);
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

      setConversation(prev => [...prev, {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl
      }]);

      // Handle audio response
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
      
      setConversation(prev => [...prev, {
        type: 'ai',
        content: "I apologize, but I'm experiencing technical difficulties. Please ensure you have a stable internet connection and try again.",
        timestamp: new Date(),
        hasAudio: false
      }]);
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="text-white font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Nurath.AI
          </div>
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
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        {conversation.length === 0 ? (
          <div className="w-full max-w-2xl text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                What can I help you with?
              </h1>
              <p className="text-lg text-gray-300">
                Voice conversations, emotion detection, environment scanning, image generation, and smart AI assistance.
              </p>
            </div>

            {/* Main Input Area */}
            <div className="space-y-6">
              <div className="relative">
                <div className="bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl p-1 shadow-2xl">
                  <div className="bg-black/20 rounded-lg border border-white/10 p-4 input-3d">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask Nurath.AI anything..."
                      className="w-full min-h-[80px] bg-transparent border-none text-white placeholder-gray-400 resize-none text-lg focus:outline-none focus:ring-0"
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
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 semi-rounded"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={isListening ? "destructive" : "ghost"}
                          onClick={isListening ? () => setIsListening(false) : startListening}
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 semi-rounded"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant={isVideoOn ? "destructive" : "ghost"}
                          onClick={isVideoOn ? stopVideo : startVideo}
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 semi-rounded"
                        >
                          {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </Button>
                        {isVideoOn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={takePhoto}
                            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 semi-rounded"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          if (inputText.trim()) {
                            handleAIInteraction(inputText);
                            setInputText("");
                          }
                        }}
                        disabled={!inputText.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 rounded-lg semi-rounded"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => handleAIInteraction("Sing me a beautiful song with your voice and sing the actual lyrics", 'voice')}
                  variant="outline"
                  className="bg-black/30 backdrop-blur-lg border-white/20 text-white hover:bg-white/10 semi-rounded p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-sm">Sing Song</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Tell me a funny joke using your voice", 'voice')}
                  variant="outline"
                  className="bg-black/30 backdrop-blur-lg border-white/20 text-white hover:bg-white/10 semi-rounded p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Smile className="w-5 h-5" />
                  <span className="text-sm">Tell Joke</span>
                </Button>
                <Button
                  onClick={() => handleAIInteraction("Generate a creative logo design for me", 'text')}
                  variant="outline"
                  className="bg-black/30 backdrop-blur-lg border-white/20 text-white hover:bg-white/10 semi-rounded p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Palette className="w-5 h-5" />
                  <span className="text-sm">Generate Image</span>
                </Button>
                <Button
                  onClick={startVideo}
                  variant="outline"
                  className="bg-black/30 backdrop-blur-lg border-white/20 text-white hover:bg-white/10 semi-rounded p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Recognize & Scan</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl w-full">
            {/* Video Feed */}
            {isVideoOn && (
              <div className="bg-black/30 backdrop-blur-lg border border-white/20 mb-6 rounded-xl overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button onClick={takePhoto} size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 semi-rounded">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 semi-rounded">
                        <Heart className="w-4 h-4 mr-2" />
                        Detect Emotion
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction("Look around and tell me where I am and describe my surroundings in detail", 'video')}
                        size="sm" 
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 semi-rounded"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Scan Location
                      </Button>
                    </div>
                    <Button onClick={stopVideo} size="sm" variant="destructive" className="semi-rounded">
                      <VideoOff className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Magical Chat Messages */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto mb-6 px-4">
              {conversation.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80' 
                      : 'bg-black/40 backdrop-blur-lg border border-white/20'
                  } rounded-2xl p-4 shadow-xl`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}>
                        {message.type === 'user' ? <Users className="w-3 h-3 text-white" /> : <Brain className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm text-white">
                        {message.type === 'user' ? 'You' : 'Nurath.AI'}
                      </span>
                      {message.hasAudio && (
                        <div className="flex items-center gap-1">
                          <Volume2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Voice</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-white">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block text-gray-300">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Input Area */}
            <div className="bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl p-1">
              <div className="bg-black/20 rounded-lg border border-white/10 p-4 input-3d">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Continue the conversation..."
                      className="min-h-[60px] resize-none bg-transparent border-none text-white placeholder-gray-400 focus:outline-none focus:ring-0"
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
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-400 hover:text-white semi-rounded hover:bg-white/10"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isListening ? "destructive" : "secondary"}
                      onClick={isListening ? () => setIsListening(false) : startListening}
                      className="semi-rounded"
                    >
                      {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isVideoOn ? "destructive" : "secondary"}
                      onClick={isVideoOn ? stopVideo : startVideo}
                      className="semi-rounded"
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white semi-rounded"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default MultimodalAI;
