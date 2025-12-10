
import React, { useState, useRef, useCallback, useEffect } from "react";
import Message from "./Message";
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
  Clock,
  Eye,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  StopCircle,
  Menu,
  Plus,
  Settings,
  X,
  Shield,
  Sparkles,
  FileText,
  File as FileIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import UserAuthButton from "@/components/UserAuthButton";

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: any[];
  hasAudio?: boolean;
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  downloadUrl?: string;
  fileData?: {
    type: string;
    content: string;
    metadata?: any;
  };
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<'text' | 'voice' | 'video'>('text');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    date: string;
    messages: ConversationMessage[];
  }>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  
  // Refs for auto-scroll functionality
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to extract time from user input
  const extractTimeFromInput = useCallback((input: string) => {
    // Look for time patterns like "15:35", "3:30 PM", etc.
    const timeRegex = /(\d{1,2}):(\d{2})(\s*(AM|PM))?/i;
    const match = input.match(timeRegex);
    return match ? match[0] : null;
  }, []);

  // Auto-scroll to bottom when new messages are added - FIXED
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };
    
    // Small delay to ensure content is rendered
    setTimeout(scrollToBottom, 100);
  }, [conversation]);

  // Auto-focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  // AI Avatar URLs - using available placeholder images
  const aiAvatarImages = {
    default: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&h=400", // white robot
    speaking: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&h=400", // woman with laptop
    listening: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&h=400" // woman on bed with laptop
  };

  // Initialize recognition with better browser support
  const setupVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice recognition not supported - please try Chrome or Edge browser");
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLanguage === 'sw' ? 'sw-KE' : 'en-US';
    recognition.maxAlternatives = 1;
    
    return recognition;
  }, [currentLanguage]);

  // Enhanced TTS with better voice quality and Swahili support
  const speakText = useCallback(async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      console.log('🔊 Starting TTS for:', text.substring(0, 50) + '...');
      
      if (priority === 'high' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }

      setIsSpeaking(true);

      // Enhanced browser TTS with better quality settings
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Better voice settings for quality
        utterance.rate = 0.85; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher pitch for pleasantness
        utterance.volume = 0.9; // Higher volume

        // Wait for voices to load
        const getVoices = () => {
          return new Promise<SpeechSynthesisVoice[]>((resolve) => {
            let voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve(voices);
            } else {
              speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
                resolve(voices);
              };
            }
          });
        };

        const voices = await getVoices();
        console.log('🔊 Available voices:', voices.map(v => `${v.name} (${v.lang})`));

        if (voices.length > 0) {
          let selectedVoice = null;

          // Language-specific voice selection
          if (currentLanguage === 'sw') {
            // Look for Swahili voices first
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('sw') || 
              voice.lang.includes('sw-') ||
              voice.name.toLowerCase().includes('swahili')
            );
            
            // Fallback to African English voices
            if (!selectedVoice) {
              selectedVoice = voices.find(voice => 
                voice.lang.startsWith('en-KE') || 
                voice.lang.startsWith('en-TZ') || 
                voice.lang.startsWith('en-UG')
              );
            }
            
            utterance.lang = 'sw-KE';
          } else {
            // English voice selection with preference for female voices
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('en') && (
                voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('zira') ||
                voice.name.toLowerCase().includes('woman') ||
                voice.name.toLowerCase().includes('alex') ||
                voice.name.toLowerCase().includes('karen')
              )
            );
            
            utterance.lang = 'en-US';
          }

          // Final fallback
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('🔊 Selected voice:', selectedVoice.name, selectedVoice.lang);
          }
        }

        utterance.onstart = () => {
          console.log('🔊 Browser TTS started');
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log('🔊 Browser TTS ended');
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error('🔊 Browser TTS error:', event);
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      }

      // Also try high-quality TTS via API for better quality
      try {
        console.log('🔊 Attempting API TTS...');
        const { data, error } = await supabase.functions.invoke('multimodal-ai', {
          body: {
            input: text.substring(0, 4000),
            mode: 'tts',
            context: { 
              settings: { 
                speechSpeed: 'normal',
                preferredVoice: 'shimmer',
                language: currentLanguage
              }
            }
          }
        });

        if (!error && data?.audioUrl) {
          console.log('🔊 API TTS successful');
          if (audioRef.current) {
            audioRef.current.src = data.audioUrl;
            audioRef.current.oncanplaythrough = () => {
              audioRef.current?.play().catch(err => {
                console.error('Audio play error:', err);
              });
            };
            audioRef.current.onended = () => setIsSpeaking(false);
            audioRef.current.onerror = () => setIsSpeaking(false);
          }
        } else {
          console.log('🔊 API TTS failed, using browser TTS only');
        }
      } catch (apiError) {
        console.log('🔊 API TTS error:', apiError);
      }
    } catch (error) {
      console.error('🔊 TTS Error:', error);
      setIsSpeaking(false);
      toast.error('Speech synthesis failed');
    }
  }, [currentLanguage]);

  // Enhanced file analysis - FIXED: Corrected Promise constructor syntax
  const analyzeFile = useCallback(async (file: File) => {
    try {
      console.log('📁 Analyzing file:', file.name, file.type, 'Size:', file.size);
      setIsProcessing(true);
      
      const fileData = await new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const result = e.target?.result;
            if (!result) {
              throw new Error('Failed to read file content');
            }
            
            const processedFileData = {
              type: file.type,
              data: result as string,
              name: file.name,
              size: file.size
            };
            
            console.log('📁 File processed successfully:', file.name);
            resolve(processedFileData);
          } catch (err) {
            console.error('📁 File processing error:', err);
            reject(err);
          }
        };
        
        reader.onerror = (err) => {
          console.error('📁 File read error:', err);
          reject(new Error('Failed to read file'));
        };
        
        // Read file as data URL (base64)
        reader.readAsDataURL(file);
      });
      
      return fileData;
    } catch (error) {
      console.error('📁 File analysis error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Enhanced AI interaction with better error handling and controlled speaking
  const handleAIInteraction = useCallback(async (
    input: string, 
    mode: 'text' | 'voice' | 'image' | 'video' | 'image_generation' | 'document' | 'song_generation' | 'song_identification' | 'alarm' = 'text', 
    attachments?: any[],
    forceSpeak: boolean = false
  ) => {
    try {
      console.log("🧠 AI Interaction:", { input: input.substring(0, 50), mode, forceSpeak });
      
      if (!input.trim() && !attachments?.length) {
        toast.error("Please provide some input");
        return;
      }

      setIsProcessing(true);

      const newMessage: ConversationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date(),
        attachments: attachedFiles.length > 0 ? attachedFiles : attachments,
        id: Date.now().toString()
      };

      setConversation(prev => [...prev, newMessage]);

      // Determine mode based on input keywords
      const songKeywords = ['generate song', 'create song', 'make song', 'compose music', 'write song'];
      const identifyKeywords = ['what song is this', 'identify song', 'song name', 'shazam', 'recognize music'];
      const alarmKeywords = ['set alarm', 'wake me up', 'reminder', 'alert me'];
      const imageKeywords = ['generate', 'create', 'make', 'draw', 'design', 'show me'];
      const imageTypes = ['image', 'picture', 'photo', 'logo', 'artwork', 'art', 'anime', 'drawing', 'illustration'];
      
      let detectedMode = mode;
      if (songKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
        detectedMode = 'song_generation';
      } else if (identifyKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
        detectedMode = 'song_identification';
      } else if (alarmKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
        detectedMode = 'alarm';
      } else if (mode === 'image_generation' || 
          (imageKeywords.some(keyword => input.toLowerCase().includes(keyword)) && 
           imageTypes.some(type => input.toLowerCase().includes(type)))) {
        detectedMode = 'image_generation';
      }

      // FIXED: Only speak when explicitly requested or in voice/video modes
      const shouldSpeak = forceSpeak || mode === 'voice' || mode === 'video';

      console.log("🧠 Calling Supabase function...");
      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode: detectedMode,
          attachments: attachedFiles.length > 0 ? attachedFiles : attachments,
          videoEnabled: isVideoOn,
          generateImage: detectedMode === 'image_generation',
          analyzeFile: (attachedFiles.length > 0 ? attachedFiles : attachments) && (attachedFiles.length > 0 ? attachedFiles : attachments).length > 0,
          shouldSpeak: shouldSpeak, // Explicitly control when to speak
          userEmail: user?.email,
          userProfile: profile,
          context: {
            currentMode,
            userId: user?.id,
            language: currentLanguage,
            conversationHistory: conversation.slice(-5)
          }
        }
      });

      if (error) {
        console.error('🚨 AI Error:', error);
        throw new Error(error.message || 'AI service temporarily unavailable');
      }

      console.log("🧠 AI Response received:", data?.text?.substring(0, 50));

      const aiResponse = data;
      const aiMessage: ConversationMessage = {
        type: 'ai',
        content: aiResponse.text || 'I apologize, but I had trouble processing your request.',
        timestamp: new Date(),
        hasAudio: !!aiResponse.audioUrl,
        id: (Date.now() + 1).toString(),
        imageUrl: aiResponse.imageUrl
      };

      setConversation(prev => [...prev, aiMessage]);

      // Handle wake-up request - extract time from AI response
      if (aiResponse.isWakeUpRequest || aiResponse.wakeUpTime) {
        const wakeTime = aiResponse.wakeUpTime || extractTimeFromInput(input);
        await createWakeUpNotification("Time to wake up! Your daily assistant is here to help you get up early!", wakeTime);
      }

      // Handle image generation success
      if (aiResponse.imageUrl) {
        toast.success("🎨 Image generated successfully!");
      }

      // Handle audio playback ONLY when audio is provided
      if (aiResponse.audioUrl && audioRef.current) {
        try {
          console.log('🔊 Playing API audio response');
          audioRef.current.src = aiResponse.audioUrl;
          setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          await audioRef.current.play();
        } catch (audioError) {
          console.error('🔊 Audio playback error:', audioError);
          setIsSpeaking(false);
          // Only fallback to browser TTS if we were supposed to speak
          if (shouldSpeak) {
            await speakText(aiResponse.text, 'normal');
          }
        }
      } else if (shouldSpeak) {
        // Use browser TTS only when explicitly requested
        await speakText(aiResponse.text, 'normal');
      }

      // Save conversation if user is logged in
      if (user && currentConversationId) {
        try {
          await supabase.from('chat_messages').insert([
            {
              user_id: user.id,
              conversation_id: currentConversationId,
              role: 'user',
              content: input,
              type: mode
            },
            {
              user_id: user.id,
              conversation_id: currentConversationId,
              role: 'assistant',
              content: aiResponse.text,
              type: 'text'
            }
          ]);
        } catch (saveError) {
          console.error('Error saving conversation:', saveError);
        }
      }

    } catch (error) {
      console.error('🚨 AI interaction error:', error);
      const errorText = error.message || "I'm having technical difficulties. Please try again.";
      
      const errorMessage: ConversationMessage = {
        type: 'ai',
        content: errorText,
        timestamp: new Date(),
        hasAudio: false,
        id: (Date.now() + 2).toString()
      };
      setConversation(prev => [...prev, errorMessage]);
      
      // Only speak errors in voice/video modes or when forced
      if (forceSpeak || mode === 'voice' || mode === 'video') {
        await speakText(errorText, 'high');
      }
      
      toast.error(errorText);
    } finally {
      setIsProcessing(false);
    }
  }, [currentMode, isVideoOn, conversation, user, currentConversationId, speakText, currentLanguage]);

  // Enhanced voice recognition with language support
  const startListening = useCallback(async () => {
    try {
      const recognition = setupVoiceRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log("🎤 Voice recognition started");
        toast.success(`🎤 Listening in ${currentLanguage === 'sw' ? 'Swahili' : 'English'}... Speak now!`);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("🎤 Voice input received:", transcript);
        
        if (transcript.trim()) {
          setInputText(transcript);
          handleAIInteraction(transcript, 'voice', undefined, true);
        }
        setIsListening(false);
      };

      recognition.onerror = (error) => {
        console.error("🚨 Speech recognition error:", error);
        setIsListening(false);
        toast.error(`Voice recognition error: ${error.error}. Please check microphone permissions.`);
      };

      recognition.onend = () => {
        console.log("🎤 Voice recognition ended");
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("🚨 Voice recognition start error:", error);
      setIsListening(false);
      toast.error("Could not start voice recognition. Please check microphone permissions.");
    }
  }, [handleAIInteraction, setupVoiceRecognition, currentLanguage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Enhanced camera functions with REAL video functionality for blind users
  const startVideo = useCallback(async () => {
    try {
      console.log("📹 Starting camera for real-time video analysis...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera by default for better scene analysis
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsVideoOn(true);
          setCurrentMode('video');
          
          // Immediately announce video activation
          const activationMessage = "🎥 Camera is now ACTIVE! I can see through your camera and will describe everything in detail. Perfect for helping blind users navigate their environment.";
          toast.success("📹 Camera activated - Real-time vision enabled!");
          speakText(activationMessage, 'high');
          
          // Add immediate video analysis message
          const videoMessage: ConversationMessage = {
            type: 'ai',
            content: activationMessage,
            timestamp: new Date(),
            hasAudio: false,
            id: Date.now().toString()
          };
          setConversation(prev => [...prev, videoMessage]);
          
          // Start continuous video analysis every 8 seconds for blind assistance
          const analysisInterval = setInterval(async () => {
            if (videoRef.current && isVideoOn) {
              await takeRealTimePhoto(); // Auto-capture and analyze
            } else {
              clearInterval(analysisInterval);
            }
          }, 8000);
        };
      }
    } catch (error) {
      console.error("📹 Camera error:", error);
      setIsVideoOn(false);
      toast.error(`Camera failed: ${error.message}`);
    }
  }, [isVideoOn, speakText]);

  // FIXED: Real-time video analysis for blind assistance
  const takeRealTimePhoto = useCallback(async () => {
    if (!videoRef.current || !isVideoOn) return;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        await handleAIInteraction(
          "Describe what you see in this live video feed. Tell me about people, objects, movements, and environment.",
          'video',
          [{
            type: 'image/jpeg',
            data: imageData,
            name: 'live-feed.jpg',
            size: imageData.length
          }],
          true
        );
      }
    } catch (error) {
      console.error("📸 Video analysis error:", error);
    }
  }, [isVideoOn, handleAIInteraction]);

  // Manual photo capture for button clicks
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !isVideoOn) {
      toast.error("Please turn on camera first");
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const prompt = "Analyze this camera view and describe everything you see in detail.";
      
      // Process immediately with AI
      await handleAIInteraction(
        prompt,
        'video', 
        [{ type: 'image/jpeg', data: imageData, name: 'camera-capture.jpg' }],
        true // Always speak for video mode
      );
      
      toast.success("📸 Scene captured and analyzed!");
    } catch (error) {
      console.error("📸 Photo capture error:", error);
      toast.error("Failed to capture image");
    }
  }, [isVideoOn, handleAIInteraction]);

  // Enhanced stop video
  const stopVideo = useCallback(() => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
      setCurrentMode('text');
      toast.success("📹 Camera stopped");
    } catch (error) {
      console.error("📹 Stop video error:", error);
    }
  }, []);

  // Video recording functionality
  const startVideoRecording = useCallback(async () => {
    try {
      if (!videoRef.current?.srcObject) {
        toast.error("Please start camera first");
        return;
      }

      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        
        // Convert blob to base64 for AI analysis
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Video = reader.result as string;
          
          await handleAIInteraction(
            "Analyze this recorded video and describe everything you see. Tell me about movements, objects, people, and activities.",
            'video',
            [{
              type: 'video/webm',
              data: base64Video,
              name: 'recorded-video.webm',
              size: blob.size
            }],
            true
          );
        };
        reader.readAsDataURL(blob);
        
        setIsRecording(false);
        toast.success("📹 Video recorded and analyzed!");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("🔴 Recording started");
    } catch (error) {
      console.error("Video recording error:", error);
      toast.error("Failed to start video recording");
    }
  }, [recordedChunks, handleAIInteraction]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Enhanced file analysis with better text extraction and metadata
  const analyzeAdvancedFile = useCallback(async (file: File) => {
    try {
      console.log('📁 Advanced file analysis:', file.name, file.type, 'Size:', file.size);
      setIsProcessing(true);
      
      let extractedContent = '';
      let metadata = {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        name: file.name
      };

      // Handle different file types
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        const text = await file.text();
        extractedContent = text;
      } else if (file.type.includes('pdf')) {
        // For PDF files, we'll send the base64 data to AI for analysis
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        extractedContent = `PDF file: ${file.name}`;
        return {
          type: file.type,
          data: base64,
          name: file.name,
          size: file.size,
          extractedContent,
          metadata
        };
      } else if (file.type.startsWith('image/')) {
        extractedContent = `Image file: ${file.name}`;
      }

      const reader = new FileReader();
      const fileData = await new Promise<any>((resolve, reject) => {
        reader.onload = (e) => {
          resolve({
            type: file.type,
            data: e.target?.result as string,
            name: file.name,
            size: file.size,
            extractedContent,
            metadata
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      return fileData;
    } catch (error) {
      console.error('📁 Advanced file analysis error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Image generation with download capability
  const generateAndDownloadImage = useCallback(async (prompt: string) => {
    try {
      setIsProcessing(true);
      toast.info("🎨 Generating image...");

      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input: prompt,
          mode: 'image_generation',
          generateImage: true,
          highQuality: true,
          context: {
            currentMode,
            userId: user?.id,
            language: currentLanguage
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Image generation failed');
      }

      if (data?.imageUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.imageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add to conversation with download option
        const imageMessage: ConversationMessage = {
          type: 'ai',
          content: "🎨 Image generated successfully! It has been automatically downloaded to your device.",
          timestamp: new Date(),
          hasAudio: false,
          id: Date.now().toString(),
          imageUrl: data.imageUrl,
          downloadUrl: data.imageUrl
        };

        setConversation(prev => [...prev, imageMessage]);
        toast.success("🎨 Image generated and downloaded!");
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(`Failed to generate image: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [currentMode, user, currentLanguage]);

  // Video call functionality
  const startVideoCall = useCallback(async () => {
    try {
      await startVideo();
      setIsVideoCallActive(true);
      
      // Start continuous real-time analysis for video calls
      const callInterval = setInterval(async () => {
        if (videoRef.current && isVideoCallActive) {
          await takeRealTimePhoto();
        } else {
          clearInterval(callInterval);
        }
      }, 5000); // Analyze every 5 seconds during video call

      toast.success("📹 Video call started - I can see you now!");
      
      // Welcome message for video call
      const callMessage: ConversationMessage = {
        type: 'ai',
        content: "📹 Video call is now active! I can see you through the camera and will help you navigate your environment. Feel free to ask me to describe what I see or help you with anything visual.",
        timestamp: new Date(),
        hasAudio: true,
        id: Date.now().toString()
      };
      
      setConversation(prev => [...prev, callMessage]);
      speakText(callMessage.content, 'high');
    } catch (error) {
      console.error('Video call error:', error);
      toast.error('Failed to start video call');
    }
  }, [startVideo, isVideoCallActive, takeRealTimePhoto, speakText]);

  const endVideoCall = useCallback(() => {
    stopVideo();
    setIsVideoCallActive(false);
    toast.success("📹 Video call ended");
  }, [stopVideo]);

  // Wake-up notification system - FIXED with proper scheduling
  const createWakeUpNotification = useCallback(async (message: string, wakeTime?: string) => {
    try {
      console.log('⏰ Creating wake-up notification for:', wakeTime);
      
      let delay = 0;
      
      // If wake time is specified, calculate delay
      if (wakeTime) {
        try {
          // Parse time like "15:35" or "15:35 PM"
          const timeStr = wakeTime.replace(/PM|AM/gi, '').trim();
          const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
          
          const now = new Date();
          const targetTime = new Date();
          targetTime.setHours(hours, minutes, 0, 0);
          
          // If target time is in the past, set for next day
          if (targetTime < now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          
          delay = targetTime.getTime() - now.getTime();
          
          console.log('⏰ Alarm scheduled for:', targetTime, 'Delay:', delay, 'ms');
          toast.success(`⏰ Wake-up alarm set for ${targetTime.toLocaleTimeString()}!`);
        } catch (err) {
          console.error('⏰ Time parsing error:', err);
          delay = 5000; // Default to 5 seconds for testing
        }
      }
      
      // Schedule the alarm
      setTimeout(() => {
        console.log('⏰ TRIGGERING WAKE UP ALARM NOW!');
        
        // Multiple loud alarm sounds
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmczBSuB0fPTgzoIGGS57umjUQwOUarm7blmGgU5ltDyyHkpBSl+zPLaizsIGGe+8OOVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IGma78OKVPQgUYrjn7aJTDQ1Qpd/zv2U0BSyBzvDbhTkIGGi68udqGQY7k9n1xXQpBSF6yO/YjD0IG');
        audio.volume = 1.0;
        audio.loop = true;
        audio.play();
        
        // Create multiple notifications
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('🚨⏰ WAKE UP ALARM! ⏰🚨', {
                body: message + " - ALARM RINGING NOW!",
                icon: '/favicon.ico',
                tag: 'wake-up-alarm-' + i,
                requireInteraction: true,
                silent: false
              });

              notification.onclick = () => {
                window.focus();
                notification.close();
              };

              setTimeout(() => notification.close(), 60000);
            }
          }, i * 1000);
        }
        
        // Create extremely loud speech alerts
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            speakText("WAKE UP! WAKE UP! WAKE UP! YOUR ALARM IS RINGING! TIME TO GET UP NOW!", 'high');
          }, i * 3000);
        }
        
        // Show persistent toast
        toast.error("🚨⏰ WAKE UP ALARM IS RINGING! 🚨⏰", { duration: 30000 });
        
        // Stop alarm after 60 seconds
        setTimeout(() => {
          audio.pause();
        }, 60000);
        
      }, delay);

      if (!wakeTime) {
        toast.success("⏰ Wake-up alarm activated immediately!");
      }
      
    } catch (error) {
      console.error('Wake-up notification error:', error);
    }
  }, [speakText]);

  // Enhanced file upload handling with better analysis
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log("📁 File upload started:", file.name, file.type, file.size);
    
    try {
      toast.info(`📁 Processing ${file.name}...`);
      
      // Use advanced file analysis
      const fileData = await analyzeAdvancedFile(file);
      
      // Add to attached files with metadata
      setAttachedFiles(prev => [...prev, fileData]);
      
      toast.success(`📁 ${file.name} uploaded! Add your instructions and click send.`);
    } catch (error) {
      console.error('📁 File upload error:', error);
      toast.error(`Failed to process ${file.name}. Please try again.`);
    }
  }, [analyzeAdvancedFile]);

  // FIXED: File input click handler
  const handleFileInputClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Remove attached file
  const removeAttachedFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);


  // Authentication check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Set language preference from profile
        if (profileData?.language_preference) {
          setCurrentLanguage(profileData.language_preference);
        }

        // Create initial conversation if none exists
        if (!currentConversationId) {
          const newConversationId = Date.now().toString();
          setCurrentConversationId(newConversationId);
        }
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setProfile(null);
        setConversationHistory([]);
        setConversation([]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [currentConversationId]);

  // Handle user login/signup/logout
  const handleLogin = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logged in successfully!");
  }, []);

  const handleSignup = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created successfully! Please check your email.");
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setConversationHistory([]);
    setConversation([]);
    toast.success("Logged out successfully");
  }, []);

  // Start new chat
  const startNewChat = useCallback(() => {
    const newConversationId = Date.now().toString();
    setCurrentConversationId(newConversationId);
    setConversation([]);
    toast.success("New chat started");
  }, []);

  // Quick action handler with proper voice response
  const handleQuickAction = useCallback(async (actionType: string, prompt: string) => {
    const shouldSpeak = ['sing', 'emotional', 'daily', 'emergency', 'recognize'].some(action => 
      actionType.includes(action) || prompt.toLowerCase().includes(action)
    );
    
    await handleAIInteraction(
      prompt, 
      actionType === 'video' ? 'video' : actionType === 'voice' ? 'voice' : 'text', 
      undefined, 
      shouldSpeak
    );
  }, [handleAIInteraction]);

  // Auto-setup when mode changes with better video handling
  useEffect(() => {
    if (currentMode === 'voice' && !isListening && !isProcessing) {
      // Auto-start listening when switching to voice mode
      setTimeout(() => startListening(), 500);
    } else if (currentMode !== 'voice' && isListening) {
      stopListening();
    }

    if (currentMode === 'video' && !isVideoOn) {
      // Auto-start video when switching to video mode
      setTimeout(() => startVideo(), 1000);
    } else if (currentMode !== 'video' && isVideoOn) {
      // Don't auto-stop video when switching modes - let user control it
    }
  }, [currentMode, startListening, stopListening, startVideo, isListening, isVideoOn, isProcessing]);

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-black flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50 border-r border-white/5`}>
        {isSidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative z-50 bg-black h-full flex flex-col">
              {/* Profile & New Chat */}
              <div className="p-4">
                {/* User Profile Display */}
                {user && (
                  <div className="flex items-center p-3 mb-4">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-white/10 text-white">
                        {profile?.full_name 
                          ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          : user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-white/50 hover:text-red-400 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {!user && (
                  <UserAuthButton
                    isLoggedIn={false}
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    onLogout={handleLogout}
                  />
                )}
                
                <Button
                  className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-0 mt-3"
                  onClick={() => {
                    const newConversationId = Date.now().toString();
                    setCurrentConversationId(newConversationId);
                    setConversation([]);
                    toast.success("New chat started");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New chat
                </Button>

                {/* Language Toggle */}
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
                    onClick={() => {
                      const newLang = currentLanguage === 'en' ? 'sw' : 'en';
                      setCurrentLanguage(newLang);
                      toast.success(`Language changed to ${newLang === 'sw' ? 'Swahili' : 'English'}`);
                    }}
                  >
                    🌍 {currentLanguage === 'sw' ? 'Kiswahili' : 'English'}
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="p-4 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-black border-b border-white/5">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-semibold text-white">Nurath.AI</div>
            
            {/* Mode Selection - Icons Only */}
            <div className="flex items-center bg-white/5 rounded-full p-1">
              <Button
                variant={currentMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('text')}
                className={`h-8 w-8 p-0 rounded-full ${currentMode === 'text' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                title="Text Mode"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('voice')}
                className={`h-8 w-8 p-0 rounded-full ${currentMode === 'voice' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                title="Voice Mode"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'video' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('video')}
                className={`h-8 w-8 p-0 rounded-full ${currentMode === 'video' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                title="Video Mode"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
            
          </div>
          <ThemeToggle />
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-black" ref={chatContainerRef}>
          {conversation.length === 0 ? (
            // Welcome State with AI Avatar for Voice/Video modes
            <div className="h-full flex flex-col items-center justify-center p-8">
              {/* AI Avatar - Show during voice or video mode */}
              {(currentMode === 'voice' || currentMode === 'video') && (
                <div className="mb-8">
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                      isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                      isListening ? 'border-blue-400 shadow-lg shadow-blue-400/50' : 
                      'border-white/20 shadow-lg shadow-white/10'
                    } transition-all duration-300`}>
                      <img
                        src={
                          isSpeaking ? aiAvatarImages.speaking :
                          isListening ? aiAvatarImages.listening :
                          aiAvatarImages.default
                        }
                        alt="Nurath AI"
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSpeaking || isListening ? 'scale-110' : 'scale-100'
                        }`}
                      />
                    </div>
                    {/* Speaking animation overlay */}
                    {isSpeaking && (
                      <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse">
                        <div className="w-full h-full rounded-full bg-green-400/20 animate-ping"></div>
                      </div>
                    )}
                    {/* Listening animation overlay */}
                    {isListening && (
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse">
                        <div className="w-full h-full rounded-full bg-blue-400/20 animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {currentLanguage === 'sw' ? 'Nurath AI - Msaidizi wako wa Kiteknolojia' : 'Nurath AI - Your AI Assistant'}
                    </h2>
                    <p className="text-white/60">
                      {isSpeaking ? (currentLanguage === 'sw' ? 'Ninazungumza...' : 'Speaking...') :
                       isListening ? (currentLanguage === 'sw' ? 'Ninasikiliza...' : 'Listening...') :
                       (currentLanguage === 'sw' ? 'Bonyeza kuzungumza na AI' : 'Ready to talk with you')}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ 
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {currentLanguage === 'sw' ? 'Nini ninaweza kukusaidia?' : 'What can I help you with?'}
                </h1>
                
                {/* Core AI Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Tengeneza wimbo wa mapenzi na uimbe maneno kamili" 
                        : "Generate a song about love with complete lyrics", 
                      'song_generation', undefined, true
                    )}
                    variant="ghost"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Tengeneza Wimbo' : 'Generate Song'}</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Hii ni wimbo gani?" 
                        : "What song is this?", 
                      'song_identification', undefined, true
                    )}
                    variant="ghost"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Tambua Wimbo' : 'Identify Song'}</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Weka kengele saa 7:00 asubuhi" 
                        : "Set alarm for 7:00 AM", 
                      'alarm', undefined, true
                    )}
                    variant="ghost"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Weka Kengele' : 'Set Alarm'}</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentMode('video');
                      startVideo();
                    }}
                    variant="ghost"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-white hover:bg-white/5 border border-white/10"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Simu ya Video' : 'Video Call'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed - Enhanced with AI Avatar Split Screen */}
              {isVideoOn && (
                <div className="p-4">
                  <div className="rounded-2xl overflow-hidden">
                    <div className="relative">
                      {/* Split screen layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                        {/* User video */}
                        <div className="relative rounded-xl overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-full h-48 md:h-64 object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border-0">
                              <Users className="w-3 h-3 mr-1" />
                              {currentLanguage === 'sw' ? 'Wewe' : 'You'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* AI Avatar */}
                        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                          <div className="w-full h-48 md:h-64 flex items-center justify-center">
                            <div className="relative">
                              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${
                                isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                                isListening ? 'border-purple-400 shadow-lg shadow-purple-400/50' : 
                                'border-white/20'
                              } transition-all duration-300`}>
                                <img
                                  src={
                                    isSpeaking ? aiAvatarImages.speaking :
                                    isListening ? aiAvatarImages.listening :
                                    aiAvatarImages.default
                                  }
                                  alt="Nurath AI"
                                  className={`w-full h-full object-cover transition-transform duration-300 ${
                                    isSpeaking || isListening ? 'scale-110' : 'scale-100'
                                  }`}
                                />
                              </div>
                              {/* Speaking animation */}
                              {isSpeaking && (
                                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse">
                                  <div className="w-full h-full rounded-full bg-green-400/20 animate-ping"></div>
                                </div>
                              )}
                              {/* Listening animation */}
                              {isListening && (
                                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse">
                                  <div className="w-full h-full rounded-full bg-blue-400/20 animate-ping"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-purple-500/20 text-purple-400 border-0">
                              <Brain className="w-3 h-3 mr-1" />
                              Nurath AI
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500/20 text-green-400 border-0">
                              <Video className="w-3 h-3 mr-1" />
                              {currentLanguage === 'sw' ? 'Mzunguko' : 'Live'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-wrap gap-2">
                      <Button 
                        onClick={takePhoto}
                        size="sm" 
                        variant="ghost" 
                        className="text-white hover:bg-white/10"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Piga Picha' : 'Take Photo'}
                      </Button>
                      <Button 
                        onClick={isRecording ? stopVideoRecording : startVideoRecording}
                        size="sm" 
                        variant={isRecording ? "destructive" : "ghost"}
                        className={isRecording ? "" : "text-white hover:bg-white/10"}
                      >
                        {isRecording ? (
                          <>
                            <StopCircle className="w-4 h-4 mr-2" />
                            {currentLanguage === 'sw' ? 'Acha Kurekodi' : 'Stop Recording'}
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            {currentLanguage === 'sw' ? 'Rekodi Video' : 'Record Video'}
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction(
                          currentLanguage === 'sw' 
                            ? "Eleza mazingira yangu kwa undani" 
                            : "Describe my surroundings in detail", 
                          'video', undefined, true
                        )}
                        size="sm" 
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Changua Eneo' : 'Analyze Scene'}
                      </Button>
                      <Button onClick={stopVideo} size="sm" variant="destructive">
                        <VideoOff className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Zima Kamera' : 'Stop Camera'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Messages Display */}
              <div className="space-y-4 p-6">
                {conversation.map((message) => (
                  <Message
                    key={message.id}
                    content={message.content}
                    type={message.type}
                    timestamp={message.timestamp}
                    imageUrl={message.imageUrl}
                    onEdit={(newContent) => {
                      // Update message in conversation
                      setConversation(prev => 
                        prev.map(msg => 
                          msg.id === message.id 
                            ? { ...msg, content: newContent }
                            : msg
                        )
                      );
                    }}
                  />
                ))}
                
                {/* Processing indicator when AI is responding */}
                {isProcessing && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%] mr-auto">
                      <div className="px-5 py-4 text-white">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Enhanced with file attachment display */}
        <div className="bg-black p-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {file.type?.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                        ) : file.type?.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-white/50" />
                        )}
                        <span className="text-sm text-white truncate max-w-32">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachedFile(index)}
                        className="h-6 w-6 p-0 text-white/50 hover:text-red-400 hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMode === 'text' && (
              <div className="relative bg-white/5 rounded-2xl">
                <Textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    attachedFiles.length > 0 
                      ? (currentLanguage === 'sw' ? 'Ongeza maelezo kwa faili uliyoambatisha...' : 'Add instructions for your attached file...')
                      : (currentLanguage === 'sw' ? 'Andika ujumbe kwa Nurath.AI...' : 'Message Nurath.AI...')
                  }
                  className="resize-none bg-transparent px-6 py-4 pr-20 text-white placeholder-white/40 focus:outline-none focus:ring-0 rounded-2xl border-0 min-h-[80px]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputText.trim() || attachedFiles.length > 0) {
                        handleAIInteraction(inputText, currentMode, attachedFiles.length > 0 ? attachedFiles : undefined, false);
                        setInputText("");
                        setAttachedFiles([]);
                      }
                    }
                  }}
                />
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFileInputClick}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                    title={currentLanguage === 'sw' ? 'Ambatisha faili' : 'Attach file'}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (inputText.trim() || attachedFiles.length > 0) {
                        handleAIInteraction(inputText, currentMode, attachedFiles.length > 0 ? attachedFiles : undefined, false);
                        setInputText("");
                        setAttachedFiles([]);
                      }
                    }}
                    disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing}
                    size="sm"
                    className="bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={currentLanguage === 'sw' ? 'Tuma ujumbe' : 'Send message'}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentMode === 'voice' && (
              <div className="text-center">
                <div className="p-8">
                  <div className="flex flex-col items-center space-y-4">
                    {/* AI Avatar for Voice Mode */}
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                        isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                        isListening ? 'border-red-400 shadow-lg shadow-red-400/50' : 
                        'border-white/20'
                      } transition-all duration-300`}>
                        <img
                          src={
                            isSpeaking ? aiAvatarImages.speaking :
                            isListening ? aiAvatarImages.listening :
                            aiAvatarImages.default
                          }
                          alt="Nurath AI"
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isSpeaking || isListening ? 'scale-110' : 'scale-100'
                          }`}
                        />
                      </div>
                      
                      {/* Speaking animation */}
                      {isSpeaking && (
                        <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse">
                          <div className="w-full h-full rounded-full bg-green-400/20 animate-ping"></div>
                        </div>
                      )}
                      
                      {/* Listening animation */}
                      {isListening && (
                        <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse">
                          <div className="w-full h-full rounded-full bg-red-400/20 animate-ping"></div>
                        </div>
                      )}
                      
                      {/* Microphone icon overlay */}
                      <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                        isListening ? 'bg-red-500' : 'bg-white/20'
                      }`}>
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Nurath AI
                      </h3>
                      <p className="text-lg font-medium text-white">
                        {isListening 
                          ? (currentLanguage === 'sw' ? 'Sikiliza... Sema sasa!' : 'Listening... Speak now!') 
                          : isSpeaking
                          ? (currentLanguage === 'sw' ? 'Ninazungumza...' : 'Speaking...')
                          : (currentLanguage === 'sw' ? 'Bonyeza kuzungumza na AI' : 'Tap to speak with AI')}
                      </p>
                      <p className="text-sm text-white/50">
                        {currentLanguage === 'sw' ? 'Lugha: Kiswahili' : 'Language: English'}
                      </p>
                    </div>
                    
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      disabled={isProcessing}
                      className={`rounded-full ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentMode === 'video' && (
              <div className="text-center">
                <div className="p-8">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Video Display */}
                    {isVideoOn ? (
                      <div className="relative w-full max-w-md">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-64 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500/20 text-green-400 border-0">
                            <Video className="w-3 h-3 mr-1" />
                            {currentLanguage === 'sw' ? 'Mzunguko' : 'Live'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/10">
                        <Video className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    <p className="text-lg font-medium text-white">
                      {isVideoOn 
                        ? (currentLanguage === 'sw' ? 'Simu ya video imewashwa - Ninaweza kukuona!' : 'Video call active - I can see you!') 
                        : (currentLanguage === 'sw' ? 'Anza simu ya video na AI' : 'Start video call with AI')}
                    </p>
                    
                    <div className="flex space-x-4">
                      <Button
                        onClick={isVideoOn ? stopVideo : startVideo}
                        size="lg"
                        disabled={isProcessing}
                        className={`rounded-full ${
                          isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isVideoOn ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                      </Button>
                      
                      {isVideoOn && (
                        <Button
                          onClick={takeRealTimePhoto}
                          size="lg"
                          disabled={isProcessing}
                          className="rounded-full bg-white text-black hover:bg-white/90"
                        >
                          <Eye className="w-6 h-6" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced File Input with More Formats */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.ppt,.pptx,.json,.xml,.html,.css,.js,.py,.java,.cpp,.c,.zip,.rar"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default MultimodalAI;
