
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Mic, 
  MicOff, 
  Upload, 
  Video, 
  VideoOff, 
  Heart, 
  Brain, 
  Users,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Smile,
  Eye,
  Music,
  Scan
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Nurath.AI
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your Personal World Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {currentEmotion && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Heart className="w-3 h-3 mr-1" />
                  {currentEmotion.primary} ({Math.round(currentEmotion.confidence * 100)}%)
                </Badge>
              )}
              
              {recognizedPeople.length > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  <Users className="w-3 h-3 mr-1" />
                  {recognizedPeople.length} people recognized
                </Badge>
              )}

              {isSpeaking && (
                <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
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
              <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 right-4 space-x-2">
                    <Button
                      onClick={captureForEmotion}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Check Emotion
                    </Button>
                    <Button
                      onClick={captureEnvironment}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                    >
                      <Scan className="w-4 h-4 mr-1" />
                      Scan Area
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation Area */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-xl">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Hello! I'm Nurath.AI 🌟
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        Your personal world assistant! I can see, hear, understand emotions, recognize faces, 
                        and provide real-time assistance with voice responses. Try talking to me!
                      </p>
                      
                      {/* Quick Start Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                        <Button 
                          onClick={() => handleAIInteraction("Hello! How can you help me today?")}
                          className="flex flex-col h-20 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                        >
                          <Brain className="w-6 h-6 mb-1" />
                          Say Hello
                        </Button>
                        <Button 
                          onClick={startVideo}
                          className="flex flex-col h-20 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
                        >
                          <Video className="w-6 h-6 mb-1" />
                          Start Video
                        </Button>
                        <Button 
                          onClick={startListening}
                          className="flex flex-col h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                        >
                          <Mic className="w-6 h-6 mb-1" />
                          Voice Chat
                        </Button>
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col h-20 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                        >
                          <ImageIcon className="w-6 h-6 mb-1" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                            : 'bg-white dark:bg-gray-800 shadow-lg border border-purple-100 dark:border-gray-700'
                        } rounded-2xl p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-white/20' 
                                : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                            }`}>
                              {message.type === 'user' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <Brain className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="font-semibold">
                              {message.type === 'user' ? 'You' : 'Nurath.AI'}
                            </span>
                            {message.hasAudio && (
                              <Volume2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="mb-2">{message.content}</p>
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-purple-100 dark:border-gray-700 p-6 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="💬 Tell me anything, ask questions, or share how you're feeling..."
                        className="min-h-[60px] resize-none border-purple-200 focus:border-purple-400 rounded-xl bg-white/80 dark:bg-gray-800/80"
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

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isListening ? "destructive" : "secondary"}
                          onClick={isListening ? () => setIsListening(false) : startListening}
                          className="shadow-md"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={isVideoOn ? "destructive" : "secondary"}
                          onClick={isVideoOn ? stopVideo : startVideo}
                          className="shadow-md"
                        >
                          {isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="shadow-md"
                        >
                          <Upload className="w-4 h-4" />
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
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                      >
                        Send ✨
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Quick Voice Actions */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Volume2 className="w-5 h-5" />
                  Voice Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSingSong}
                  className="w-full justify-start bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Sing Me a Song 🎵
                </Button>
                <Button 
                  onClick={handleTellJoke}
                  className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md"
                >
                  <Smile className="w-4 h-4 mr-2" />
                  Tell Me a Joke 😄
                </Button>
                <Button 
                  onClick={handleEmotionCheck}
                  className="w-full justify-start bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Check My Emotions 💝
                </Button>
                <Button 
                  onClick={handleEnvironmentScan}
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Scan Environment 👁️
                </Button>
              </CardContent>
            </Card>

            {/* Recognized People */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Recognized People
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recognizedPeople.length > 0 ? (
                  <div className="space-y-3">
                    {recognizedPeople.map((person) => (
                      <div key={person.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {person.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.relationship}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      No people recognized yet. Show me photos of your family and friends!
                    </p>
                  </div>
                )}
              </CardContent>
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
