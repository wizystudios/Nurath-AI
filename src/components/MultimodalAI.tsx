
import React, { useState, useRef, useCallback, useEffect } from "react";
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
}

const MultimodalAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
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
    mode: 'text' | 'voice' | 'image' | 'video' | 'image_generation' | 'document' = 'text', 
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
        attachments,
        id: Date.now().toString()
      };

      setConversation(prev => [...prev, newMessage]);

      // Determine if this should generate an image
      const imageKeywords = ['generate', 'create', 'make', 'draw', 'design', 'show me'];
      const imageTypes = ['image', 'picture', 'photo', 'logo', 'artwork', 'art', 'anime', 'drawing', 'illustration'];
      
      const shouldGenerateImage = mode === 'image_generation' || 
          (imageKeywords.some(keyword => input.toLowerCase().includes(keyword)) && 
           imageTypes.some(type => input.toLowerCase().includes(type)));

      // FIXED: Only speak when explicitly requested or in voice/video modes
      const shouldSpeak = forceSpeak || mode === 'voice' || mode === 'video';

      console.log("🧠 Calling Supabase function...");
      const { data, error } = await supabase.functions.invoke('multimodal-ai', {
        body: {
          input,
          mode: shouldGenerateImage ? 'image_generation' : mode,
          attachments,
          videoEnabled: isVideoOn,
          generateImage: shouldGenerateImage,
          analyzeFile: attachments && attachments.length > 0,
          shouldSpeak: shouldSpeak, // Explicitly control when to speak
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

  // Enhanced camera functions with better error handling and constraints
  const startVideo = useCallback(async () => {
    try {
      console.log("📹 Starting camera...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      // Try with different constraint sets for better compatibility
      const constraintSets = [
        // High quality constraints
        { 
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          }, 
          audio: false 
        },
        // Medium quality constraints
        { 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }, 
          audio: false 
        },
        // Basic constraints
        { 
          video: true, 
          audio: false 
        }
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of constraintSets) {
        try {
          console.log("📹 Trying constraints:", constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          console.log("📹 Constraints failed:", error);
          lastError = error;
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error("Could not access camera with any configuration");
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsVideoOn(true);
              console.log("📹 Camera started successfully");
              toast.success("🎥 Camera activated! I can now see through your camera.");
              
              if (currentMode === 'video') {
                speakText("Camera is now active. I can see your environment. Let me describe what I see.", 'normal');
                
                // Start continuous vision analysis for blind users
                setTimeout(async () => {
                  await takePhoto();
                  // Set up interval for continuous analysis every 10 seconds
                  const analysisInterval = setInterval(async () => {
                    if (isVideoOn && currentMode === 'video') {
                      await takePhoto();
                    } else {
                      clearInterval(analysisInterval);
                    }
                  }, 10000);
                }, 2000);
              }
            }).catch((playError) => {
              console.error("📹 Play error:", playError);
              throw new Error("Could not start video playback");
            });
          }
        };

        videoRef.current.onerror = (error) => {
          console.error("📹 Video element error:", error);
          stopVideo();
          toast.error("Video playback error occurred");
        };
      }
      
    } catch (error) {
      console.error("🚨 Camera error:", error);
      let errorMessage = "Camera access failed. ";
      
      if (error.name === 'NotFoundError') {
        errorMessage += "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage += "Camera permission denied. Please allow camera access in your browser settings and refresh the page.";
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Camera is being used by another application. Please close other applications using the camera.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += "Camera constraints not supported. Trying with basic settings...";
      } else {
        errorMessage += error.message || "Unknown camera error occurred.";
      }
      
      await speakText(errorMessage, 'high');
      toast.error(errorMessage);
      setIsVideoOn(false);
    }
  }, [handleAIInteraction, speakText, currentMode]);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("📹 Camera track stopped:", track.kind);
      });
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
    if (currentMode === 'video') {
      speakText("Camera stopped. Video call ended.", 'normal');
    }
    toast.info("📹 Camera stopped - Video call ended");
  }, [speakText, currentMode]);

  // FIXED: Proper file upload handling
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log("📁 File upload started:", file.name, file.type, file.size);
    
    try {
      toast.info(`📁 Processing ${file.name}...`);
      
      // Process the file
      const fileData = await analyzeFile(file);
      
      // Add to attached files
      setAttachedFiles(prev => [...prev, fileData]);
      
      // Determine file type and mode
      let mode: 'image' | 'document' | 'text' = 'document';
      let prompt = `I've uploaded a file named "${file.name}". Please analyze it thoroughly and tell me everything you can discover from it.`;
      
      if (file.type.startsWith('image/')) {
        mode = 'image';
        prompt = `I've uploaded an image file named "${file.name}". Please analyze this image in detail and describe everything you can see.`;
      } else if (file.type.includes('pdf') || file.type.includes('doc') || file.type.includes('text')) {
        mode = 'document';
        prompt = `I've uploaded a document file named "${file.name}". Please analyze it thoroughly and tell me everything you can discover from it.`;
      }
      
      // Automatically process the file
      await handleAIInteraction(
        prompt,
        mode,
        [fileData],
        currentMode === 'voice' // Only speak in voice mode
      );
      
      toast.success(`📁 ${file.name} uploaded and analyzed successfully!`);
    } catch (error) {
      console.error('📁 File upload error:', error);
      toast.error(`Failed to process ${file.name}. Please try again.`);
    }
  }, [analyzeFile, handleAIInteraction, currentMode]);

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

  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !isVideoOn) {
      const message = "Please turn on the camera first to take a photo.";
      await speakText(message, 'high');
      toast.error(message);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Capture the current frame from video
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 and send to AI
      const base64Data = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('📸 Photo captured, sending to AI for analysis...');
      
      // Send to AI with detailed vision prompt for blind users
      await handleAIInteraction(
        "Please analyze this live camera feed image in complete detail. Describe everything you see including: people and their positions, objects and their locations, colors, lighting, background details, any text or signs, potential hazards or obstacles, and the overall environment. Be very specific and thorough as this is to help a blind person understand their surroundings.",
        'video',
        [{ type: 'image', data: base64Data, name: 'camera_feed.jpg' }],
        true // Always speak for video mode
      );
      
    } catch (error) {
      console.error('📸 Photo capture error:', error);
      const errorMsg = 'Failed to capture and analyze camera feed';
      toast.error(errorMsg);
      await speakText(errorMsg, 'high');
    }
  }, [isVideoOn, handleAIInteraction, speakText]);

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
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden md:relative fixed inset-y-0 left-0 z-50`}>
        {isSidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative z-50 bg-gray-50 dark:bg-gray-800 h-full flex flex-col">
              {/* Profile & New Chat */}
              <div className="p-3">
                {/* User Profile Display */}
                {user && (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {profile?.full_name 
                          ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          : user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-red-500"
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
                  className="w-full justify-start bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl mt-3"
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
                    variant="outline"
                    size="sm"
                    className="w-full justify-start rounded-xl"
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
              <div className="p-2 space-y-1 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 dark:text-gray-300 rounded-xl"
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 dark:text-gray-400 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-semibold text-gray-900 dark:text-white">Nurath.AI</div>
            
            {/* Mode Selection - Icons Only */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
              <Button
                variant={currentMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('text')}
                className="h-8 w-8 p-0 rounded-full"
                title="Text Mode"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('voice')}
                className="h-8 w-8 p-0 rounded-full"
                title="Voice Mode"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'video' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('video')}
                className="h-8 w-8 p-0 rounded-full"
                title="Video Mode"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
            
          </div>
          <ThemeToggle />
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
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
                      'border-purple-400 shadow-lg shadow-purple-400/50'
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
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {currentLanguage === 'sw' ? 'Nurath AI - Msaidizi wako wa Kiteknolojia' : 'Nurath AI - Your AI Assistant'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isSpeaking ? (currentLanguage === 'sw' ? 'Ninazungumza...' : 'Speaking...') :
                       isListening ? (currentLanguage === 'sw' ? 'Ninasikiliza...' : 'Listening...') :
                       (currentLanguage === 'sw' ? 'Bonyeza kuzungumza na AI' : 'Ready to talk with you')}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 animate-pulse" style={{ 
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {currentLanguage === 'sw' ? 'Nini ninaweza kukusaidia?' : 'What can I help you with?'}
                </h1>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Tafadhali nisimulie wimbo mzuri kwa sauti yako na uimbe maneno halisi" 
                        : "Please sing me a beautiful song with your voice and sing the actual lyrics", 
                      'text', undefined, true
                    )}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Music className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Imba Wimbo' : 'Sing Song'}</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentMode('video');
                      setTimeout(() => handleAIInteraction(
                        currentLanguage === 'sw' 
                          ? "Niambie unachoweza kuona karibu nami na ueleze mazingira yangu" 
                          : "Tell me what you can see around me and describe my environment", 
                        'video', undefined, true
                      ), 3000);
                    }}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Eleza Eneo' : 'Describe Scene'}</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Nahitaji msaada wa kihisia na faraja sasa hivi" 
                        : "I need emotional support and comfort right now", 
                      'text', undefined, true
                    )}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Heart className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Msaada wa Kihisia' : 'Emotional Support'}</span>
                  </Button>
                  <Button
                    onClick={() => handleAIInteraction(
                      currentLanguage === 'sw' 
                        ? "Nisaidie na ratiba yangu ya kila siku na unikumbushe mambo muhimu" 
                        : "Help me with my daily routine and remind me of important things", 
                      'text', undefined, true
                    )}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">{currentLanguage === 'sw' ? 'Msaada wa Kila Siku' : 'Daily Help'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {/* Video Feed - Enhanced with AI Avatar Split Screen */}
              {isVideoOn && (
                <div className="p-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
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
                            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                              <Users className="w-3 h-3 text-white" />
                              {currentLanguage === 'sw' ? 'Wewe' : 'You'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* AI Avatar */}
                        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                          <div className="w-full h-48 md:h-64 flex items-center justify-center">
                            <div className="relative">
                              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${
                                isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                                isListening ? 'border-purple-400 shadow-lg shadow-purple-400/50' : 
                                'border-purple-400 shadow-lg shadow-purple-400/50'
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
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                              <Brain className="w-3 h-3 mr-1" />
                              Nurath AI
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
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
                        variant="outline" 
                        className="rounded-xl"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Piga Picha' : 'Take Photo'}
                      </Button>
                      <Button 
                        onClick={() => handleAIInteraction(
                          currentLanguage === 'sw' 
                            ? "Eleza mazingira yangu kwa undani" 
                            : "Describe my surroundings in detail", 
                          'video', undefined, true
                        )}
                        size="sm" 
                        variant="outline"
                        className="rounded-xl"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Changua Eneo' : 'Analyze Scene'}
                      </Button>
                      <Button onClick={stopVideo} size="sm" variant="destructive" className="rounded-xl">
                        <VideoOff className="w-4 h-4 mr-2" />
                        {currentLanguage === 'sw' ? 'Zima Kamera' : 'Stop Camera'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Messages Display */}
              <div className="space-y-6 p-6">
                {conversation.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`flex items-start space-x-3 max-w-[85%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      {/* Enhanced Avatar */}
                      <div className="flex-shrink-0">
                        {message.type === 'user' ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {profile?.full_name 
                                ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                : user?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-white shadow-lg">
                            <img
                              src={aiAvatarImages.default}
                              alt="Nurath AI"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Message Content */}
                      <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}>
                        
                        {/* Enhanced Content Rendering */}
                        <div className="text-sm leading-relaxed">
                          {message.content.split('\n\n').map((paragraph, i) => (
                            <div key={i} className={i > 0 ? 'mt-4' : ''}>
                              {paragraph.split('\n').map((line, j) => {
                                // Enhanced formatting
                                let formattedLine = line
                                  // Bold text
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                                  // Italic text  
                                  .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                  // Headers
                                  .replace(/^### (.*$)/g, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
                                  .replace(/^## (.*$)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
                                  .replace(/^# (.*$)/g, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>')
                                  // Lists
                                  .replace(/^- (.*$)/g, '<li class="ml-4">• $1</li>')
                                  .replace(/^\d+\. (.*$)/g, '<li class="ml-4">$1</li>')
                                  // Code blocks
                                  .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">$1</code>');
                                
                                return (
                                  <p 
                                    key={j} 
                                    className={j > 0 ? 'mt-2' : ''}
                                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment, i) => (
                              <div key={i} className={`text-xs flex items-center ${
                                message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <FileText className="w-3 h-3 mr-1" />
                                {attachment.name}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Generated Image */}
                        {message.imageUrl && (
                          <div className="mt-4">
                            <img 
                              src={message.imageUrl} 
                              alt="Generated content" 
                              className="max-w-full h-auto rounded-lg border-2 border-purple-200 dark:border-purple-700 shadow-lg"
                            />
                          </div>
                        )}
                        
                        {/* Audio Indicator */}
                        {message.hasAudio && (
                          <div className={`mt-3 flex items-center text-xs ${
                            message.type === 'user' ? 'text-blue-100' : 'text-green-500 dark:text-green-400'
                          }`}>
                            <Volume2 className="w-3 h-3 mr-1" />
                            {currentLanguage === 'sw' ? 'Sauti imesikika' : 'Audio played'}
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Processing indicator when AI is responding */}
                {isProcessing && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%] mr-auto">
                      <div className="rounded-2xl px-5 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
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
        <div className="bg-white dark:bg-gray-900 p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {file.type?.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-blue-500" />
                        ) : file.type?.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-500" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachedFile(index)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMode === 'text' && (
              <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={currentLanguage === 'sw' ? 'Andika ujumbe kwa Nurath.AI...' : 'Message Nurath.AI...'}
                  className="resize-none bg-transparent px-6 py-4 pr-20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 rounded-2xl border-0 min-h-[80px]"
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
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl"
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
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                    title={currentLanguage === 'sw' ? 'Tuma ujumbe' : 'Send message'}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentMode === 'voice' && (
              <div className="text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    {/* AI Avatar for Voice Mode */}
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                        isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
                        isListening ? 'border-red-400 shadow-lg shadow-red-400/50' : 
                        'border-blue-500 shadow-lg shadow-blue-500/50'
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
                        isListening ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Nurath AI
                      </h3>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {isListening 
                          ? (currentLanguage === 'sw' ? 'Sikiliza... Sema sasa!' : 'Listening... Speak now!') 
                          : isSpeaking
                          ? (currentLanguage === 'sw' ? 'Ninazungumza...' : 'Speaking...')
                          : (currentLanguage === 'sw' ? 'Bonyeza kuzungumza na AI' : 'Tap to speak with AI')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLanguage === 'sw' ? 'Lugha: Kiswahili' : 'Language: English'}
                      </p>
                    </div>
                    
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      disabled={isProcessing}
                      className={`rounded-full ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
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
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Video Display */}
                    {isVideoOn ? (
                      <div className="relative w-full max-w-md">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-64 object-cover rounded-xl border-4 border-green-400 shadow-lg"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                            <Video className="w-3 h-3 mr-1" />
                            {currentLanguage === 'sw' ? 'Mzunguko' : 'Live'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                        isVideoOn ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        <Video className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
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
                          onClick={takePhoto}
                          size="lg"
                          variant="outline"
                          className="rounded-full"
                        >
                          <Camera className="w-6 h-6" />
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

      {/* Enhanced File Input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.ppt,.pptx"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <audio ref={audioRef} preload="auto" />
      
      {/* Video element - show when video is active */}
      {isVideoOn && (
        <div className="fixed top-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-white z-50">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>
      )}
    </div>
  );
};

export default MultimodalAI;
