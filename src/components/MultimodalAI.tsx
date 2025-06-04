
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
  Camera,
  Image as ImageIcon,
  StopCircle
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
        handleAIInteraction("I can see you now! Let me analyze what's in your environment.", 'video');
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
        `Please analyze this ${fileType} and tell me about it in detail. If it's an image, describe what you see. If it contains people, try to recognize them.`, 
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
            "I just took a photo. Please analyze what you see and tell me about it.", 
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border-b border-gray-800/30">
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
          {isListening && (
            <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              Listening
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        {conversation.length === 0 ? (
          <div className="w-full max-w-2xl text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight">
                What can I help you with?
              </h1>
              <p className="text-lg text-gray-400">
                Voice conversations, emotion detection, environment scanning, and smart AI assistance.
              </p>
            </div>

            {/* Main Input Area */}
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
                        <Button
                          size="sm"
                          variant={isVideoOn ? "destructive" : "ghost"}
                          onClick={isVideoOn ? stopVideo : startVideo}
                          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                        >
                          {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </Button>
                        {isVideoOn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={takePhoto}
                            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
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
            </div>
          </div>
        ) : (
          // ChatGPT-style Chat Interface
          <div className="max-w-4xl w-full">
            {/* Video Feed */}
            {isVideoOn && (
              <Card className="bg-gray-900/50 border-gray-700 mb-6 rounded-xl overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button onClick={takePhoto} size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
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

            {/* ChatGPT-style Conversation */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto mb-6">
              {conversation.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-800'} rounded-2xl p-4 shadow-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-blue-700' : 'bg-gray-700'}`}>
                        {message.type === 'user' ? <Users className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
                      </div>
                      <span className="font-medium text-sm">
                        {message.type === 'user' ? 'You' : 'Nurath.AI'}
                      </span>
                      {message.hasAudio && <Volume2 className="w-4 h-4 text-green-400" />}
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area - ChatGPT Style */}
            <div className="bg-[#2a2a2a] border border-gray-600/50 rounded-xl p-1">
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-700/30 p-4">
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
                      className="text-gray-400 hover:text-white rounded-lg"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isListening ? "destructive" : "secondary"}
                      onClick={isListening ? () => setIsListening(false) : startListening}
                      className="rounded-lg"
                    >
                      {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
