
import React, { useState, useRef, useCallback } from "react";
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
  FileText,
  Volume2,
  VolumeX
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
  }>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera/video
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoOn(true);
      toast.success("🎥 Video started! I can see you now and help with real-time analysis.");
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
    toast.info("Video stopped");
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
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          setInputText(transcript);
          handleAIInteraction(transcript, 'voice');
        }
      };

      recognition.onerror = () => {
        toast.error("Voice recognition error");
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      toast.success("🎤 Listening... Speak to me!");
    } catch (error) {
      toast.error("Could not start voice recognition");
    }
  }, []);

  // AI Interaction handler
  const handleAIInteraction = useCallback(async (input: string, mode: 'text' | 'voice' | 'image' | 'video' = 'text', attachments?: any[]) => {
    try {
      // Add user message to conversation
      setConversation(prev => [...prev, {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments
      }]);

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
            conversationHistory: conversation.slice(-5) // Last 5 messages for context
          }
        }
      });

      if (error) throw error;

      const aiResponse: AIResponse = data;

      // Update recognized people if faces were detected
      if (aiResponse.recognizedFaces) {
        setRecognizedPeople(aiResponse.recognizedFaces);
      }

      // Update emotion state
      if (aiResponse.emotion) {
        setCurrentEmotion(aiResponse.emotion);
      }

      // Add AI response to conversation
      setConversation(prev => [...prev, {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date()
      }]);

      // Play audio response if available
      if (aiResponse.audioUrl && audioRef.current) {
        audioRef.current.src = aiResponse.audioUrl;
        setIsSpeaking(true);
        audioRef.current.play();
        audioRef.current.onended = () => setIsSpeaking(false);
      }

      // Show environment description if available
      if (aiResponse.environmentDescription) {
        toast.info(`🌍 ${aiResponse.environmentDescription}`);
      }

    } catch (error) {
      console.error('AI interaction error:', error);
      toast.error("Sorry, I'm having trouble understanding. Please try again.");
    }
  }, [isVideoOn, recognizedPeople, currentEmotion, conversation]);

  // File upload handlers
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'document';

    // Convert file to base64 for processing
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      await handleAIInteraction(
        `Please analyze this ${fileType}`, 
        fileType as any, 
        [{ type: fileType, data: base64Data, name: file.name }]
      );
    };
    reader.readAsDataURL(file);
  }, [handleAIInteraction]);

  // Camera capture
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    await handleAIInteraction(
      "What do you see in this photo? Who are these people?", 
      'image', 
      [{ type: 'image', data: imageData, name: 'camera_capture.jpg' }]
    );
  }, [handleAIInteraction]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header with emotion and recognition status */}
      <div className="p-4 border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                🌟 Nurath.AI - Your World Assistant
              </h1>
            </div>
            
            {currentEmotion && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {currentEmotion.primary} ({Math.round(currentEmotion.confidence * 100)}%)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {recognizedPeople.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recognizedPeople.length} people recognized
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Video feed */}
          {isVideoOn && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-48 object-cover"
              />
              <Button
                onClick={capturePhoto}
                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Conversation area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.length === 0 ? (
              <Card className="text-center p-8">
                <CardContent>
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Hello! I'm your multimodal AI assistant! 🌟</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      I can help you with everything! I can see, hear, recognize faces, understand emotions, 
                      and provide real-time assistance. Try talking to me, showing me photos, or starting a video chat!
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                      <Button 
                        onClick={() => handleAIInteraction("Hello! How can you help me today?")}
                        variant="outline" 
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <Brain className="w-5 h-5" />
                        Say Hello
                      </Button>
                      <Button 
                        onClick={startVideo}
                        variant="outline" 
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <Video className="w-5 h-5" />
                        Video Chat
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline" 
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Upload Photo
                      </Button>
                      <Button 
                        onClick={startListening}
                        variant="outline" 
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <Mic className="w-5 h-5" />
                        Voice Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800'
                  }`}>
                    <CardContent className="p-4">
                      <p className="text-sm mb-2">{message.content}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.attachments && (
                        <div className="mt-2 text-xs opacity-80">
                          📎 {message.attachments.length} attachment(s)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="💬 Type anything, ask questions, or tell me how you're feeling..."
                  className="min-h-[60px] resize-none"
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

              {/* Control buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
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
                </div>

                <Button
                  onClick={() => {
                    if (inputText.trim()) {
                      handleAIInteraction(inputText);
                      setInputText("");
                    }
                  }}
                  disabled={!inputText.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Send ✨
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with recognized people and features */}
        <div className="w-80 border-l bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recognized People
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recognizedPeople.length > 0 ? (
                <div className="space-y-2">
                  {recognizedPeople.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm">
                        {person.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500">{person.relationship}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No people recognized yet. Show me photos of your family and friends!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAIInteraction("How are you feeling right now? Can you detect my emotions?")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Emotion Check
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAIInteraction("Describe what you can see around me")}
              >
                <Camera className="w-4 h-4 mr-2" />
                Environment Scan
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAIInteraction("Tell me a joke to cheer me up!")}
              >
                😄 Tell a Joke
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAIInteraction("Sing me a song")}
              >
                🎵 Sing a Song
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      <audio ref={audioRef} hidden />
    </div>
  );
};

export default MultimodalAI;
