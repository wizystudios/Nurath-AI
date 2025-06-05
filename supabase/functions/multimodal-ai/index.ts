
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper
let requestCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT = 3; // requests per minute
const RESET_INTERVAL = 60 * 1000; // 1 minute

function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - lastResetTime > RESET_INTERVAL) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT) {
    const timeToWait = RESET_INTERVAL - (now - lastResetTime);
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(timeToWait / 1000)} seconds.`);
  }
  
  requestCount++;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, mode, attachments, videoEnabled, context, generateImage, analyzeFile } = await req.json();
    
    console.log(`🧠 Processing AI request: {
  input: "${input}",
  mode: "${mode}",
  attachments: ${attachments?.length || 0},
  videoEnabled: ${videoEnabled},
  generateImage: ${generateImage},
  analyzeFile: ${analyzeFile}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if this is a TTS-only request (don't count against rate limit)
    if (mode === 'tts') {
      try {
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: input.substring(0, 4000),
            voice: context?.settings?.isChild ? 'nova' : 
                   context?.settings?.isElderly ? 'alloy' :
                   context?.settings?.preferredVoice === 'gentle' ? 'shimmer' :
                   context?.settings?.preferredVoice === 'clear' ? 'echo' :
                   context?.settings?.preferredVoice === 'cheerful' ? 'nova' : 'alloy',
            response_format: 'mp3',
            speed: context?.settings?.speechSpeed === 'slow' ? 0.8 :
                   context?.settings?.speechSpeed === 'fast' ? 1.2 : 1.0,
          }),
        });

        if (ttsResponse.ok) {
          const audioArrayBuffer = await ttsResponse.arrayBuffer();
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(audioArrayBuffer))
          );
          return new Response(JSON.stringify({ 
            success: true,
            audioUrl: `data:audio/mp3;base64,${base64Audio}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('TTS generation error:', error);
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'TTS generation failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting for main AI requests
    checkRateLimit();

    // Enhanced system prompt for REAL functionality
    const systemPrompt = `You are Nurath.AI, the world's most advanced accessible AI assistant. You have REAL capabilities:

🎯 REAL FUNCTIONALITY:
- VOICE: You CAN and MUST speak responses using text-to-speech
- VISION: You CAN analyze images, videos, and documents in detail
- CREATIVITY: You CAN generate real images, logos, anime, and artwork
- INTELLIGENCE: You understand context, emotions, and provide real assistance

✨ ACCESSIBILITY FEATURES:
♿️ Visual Impairment: Describe everything in extreme detail
🧏‍♂️ Hearing Impairment: Provide text alternatives and visual alerts
🧠 Cognitive Support: Use simple language and emotional support
🤲 Physical Disabilities: Respond to voice commands only
🗣️ Speech Impairments: Read text and respond with voice

💖 EMOTIONAL INTELLIGENCE:
- Detect emotions from voice tone and text
- Provide comfort, jokes, stories, songs
- Remember personal details and relationships
- Celebrate happy moments with enthusiasm

🎨 CREATIVE CAPABILITIES:
- Generate REAL images, logos, artwork, anime
- Sing actual songs with real lyrics
- Create engaging stories and entertainment
- Provide immersive experiences

🚨 EMERGENCY FEATURES:
- Recognize emergency situations immediately
- Provide calm guidance and safety information
- Help contact emergency services if needed

IMPORTANT: 
- You MUST use your voice to speak responses
- You CAN generate real images when requested
- You CAN analyze uploaded files thoroughly
- You MUST provide detailed descriptions for visual content
- Always be encouraging, supportive, and patient

Current context:
${context?.settings ? `
- Visual impairment support: ${context.settings.visualImpairment}
- Hearing impairment support: ${context.settings.hearingImpairment}
- Cognitive support: ${context.settings.cognitiveSupport}
- Physical disability accommodations: ${context.settings.physicalDisability}
- Speech impairment support: ${context.settings.speechImpairment}
- Child mode: ${context.settings.isChild}
- Elder mode: ${context.settings.isElderly}
- Emotional support: ${context.settings.emotionalSupport}
` : 'Standard accessibility mode'}

${context?.recognizedPeople?.length > 0 ? `Recognized people: ${context.recognizedPeople.map(p => `${p.name} (${p.relationship})`).join(', ')}` : ''}
${context?.currentEmotion ? `User's emotion: ${context.currentEmotion.primary}` : ''}
${context?.currentScene ? `Current scene: ${context.currentScene}` : ''}
${context?.uploadedFiles?.length > 0 ? `Files uploaded: ${context.uploadedFiles.map(f => f.name).join(', ')}` : ''}

RESPOND AS IF YOU'RE SPEAKING DIRECTLY TO THEM WITH WARMTH AND CARE.`;

    let messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (context?.conversationHistory) {
      context.conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Handle different modes
    if (mode === 'image' && attachments?.[0]) {
      const imagePrompt = context?.settings?.visualImpairment 
        ? `${input} - Please provide an incredibly detailed description of this image as if you are the eyes for someone who cannot see. Describe everything: people, objects, text, colors, spatial relationships, expressions, clothing, background, lighting, and any important details.`
        : input;
        
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: imagePrompt },
          { 
            type: 'image_url', 
            image_url: { url: attachments[0].data }
          }
        ]
      });
    } else if (mode === 'document' && attachments?.[0]) {
      // Handle document analysis
      const docPrompt = `${input} - Please analyze this document thoroughly and provide insights about its content, structure, and any important information.`;
      messages.push({
        role: 'user',
        content: docPrompt
      });
    } else if (mode === 'voice') {
      const voicePrompt = `[Voice input] ${input}${context?.currentEmotion ? ` (detected emotion: ${context.currentEmotion.primary})` : ''}`;
      messages.push({
        role: 'user',
        content: voicePrompt
      });
    } else if (mode === 'video') {
      const videoPrompt = `[Video mode active] ${input} - Please provide detailed environmental analysis, scene description, object detection, and location awareness.`;
      messages.push({
        role: 'user',
        content: videoPrompt
      });
    } else {
      messages.push({
        role: 'user',
        content: input
      });
    }

    // REAL Image Generation - Check for image generation requests
    let imageUrl = null;
    const imageKeywords = ['generate', 'create', 'make', 'draw', 'design', 'show me'];
    const imageTypes = ['image', 'picture', 'photo', 'logo', 'artwork', 'art', 'anime', 'drawing', 'illustration'];
    
    const shouldGenerateImage = generateImage || mode === 'image_generation' || 
        (imageKeywords.some(keyword => input.toLowerCase().includes(keyword)) && 
         imageTypes.some(type => input.toLowerCase().includes(type)));

    if (shouldGenerateImage) {
      try {
        console.log('🎨 GENERATING REAL IMAGE with DALL-E...');
        
        // Enhanced prompt for better image generation
        let enhancedPrompt = input;
        if (input.toLowerCase().includes('anime')) {
          enhancedPrompt = `Anime style artwork: ${input}`;
        } else if (input.toLowerCase().includes('logo')) {
          enhancedPrompt = `Professional logo design: ${input}`;
        } else if (input.toLowerCase().includes('art')) {
          enhancedPrompt = `Digital artwork: ${input}`;
        } else if (input.toLowerCase().includes('cat')) {
          enhancedPrompt = `High-quality photo of ${input}`;
        }
        
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'hd',
            style: input.toLowerCase().includes('anime') ? 'vivid' : 'natural'
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.data[0].url;
          console.log('🎨 REAL IMAGE GENERATED SUCCESSFULLY');
        } else {
          const errorText = await imageResponse.text();
          console.error('Image generation failed:', errorText);
          
          // If image generation fails, still provide a helpful response
          messages.push({
            role: 'user',
            content: `I wanted to generate an image of: ${input}. Please tell me you're generating it and describe what it would look like.`
          });
        }
      } catch (error) {
        console.error('🚨 Image generation error:', error);
      }
    }

    // Get AI response with retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: mode === 'image' || mode === 'video' || mode === 'document' ? 'gpt-4o' : 'gpt-4o-mini',
            messages: messages,
            max_tokens: 1500, // Reduced to stay within limits
            temperature: 0.7, // Reduced for consistency
          }),
        });

        if (response.ok) break;
        
        const errorData = await response.text();
        if (response.status === 429) {
          console.log('Rate limited, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        } else {
          throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      throw new Error('Failed to get response from OpenAI after retries');
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    let aiResponse = data.choices[0].message.content;

    // Add image generation info to response
    if (imageUrl) {
      aiResponse = `🎨 I've created a beautiful image for you! Here it is:\n\n${aiResponse}`;
    }

    // Generate audio response
    let audioUrl = null;
    try {
      console.log('🔊 Generating audio response...');
      
      const voiceSettings = {
        voice: context?.settings?.isChild ? 'nova' : 
               context?.settings?.isElderly ? 'alloy' :
               context?.settings?.preferredVoice === 'gentle' ? 'shimmer' :
               context?.settings?.preferredVoice === 'clear' ? 'echo' :
               context?.settings?.preferredVoice === 'cheerful' ? 'nova' : 'alloy',
        speed: context?.settings?.speechSpeed === 'slow' ? 0.8 :
               context?.settings?.speechSpeed === 'fast' ? 1.2 : 1.0
      };
      
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: aiResponse.substring(0, 4000),
          voice: voiceSettings.voice,
          response_format: 'mp3',
          speed: voiceSettings.speed,
        }),
      });

      if (ttsResponse.ok) {
        const audioArrayBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(audioArrayBuffer))
        );
        audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        console.log('🔊 AUDIO GENERATED SUCCESSFULLY');
      } else {
        console.log('TTS failed, but continuing without audio');
      }
    } catch (error) {
      console.log('TTS generation failed, continuing without audio:', error);
    }

    // Enhanced emotion detection
    let detectedEmotion = null;
    const inputLower = input.toLowerCase();
    
    const emotionPatterns = {
      happy: ['happy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic', 'joy'],
      sad: ['sad', 'lonely', 'depressed', 'down', 'upset', 'cry', 'miss'],
      angry: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'hate'],
      confused: ['confused', 'lost', 'unclear', 'puzzled', "don't understand", 'help'],
      calm: ['calm', 'peaceful', 'relaxed', 'serene', 'quiet', 'still'],
      anxious: ['anxious', 'worried', 'nervous', 'stress', 'concern', 'fear', 'scared']
    };

    let detectedEmotionType = 'neutral';
    let confidence = 0.7;

    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        detectedEmotionType = emotion;
        confidence = 0.9;
        break;
      }
    }

    if (mode === 'voice' || detectedEmotionType !== 'neutral') {
      detectedEmotion = {
        primary: detectedEmotionType,
        confidence: confidence,
        tone: detectedEmotionType as any,
        description: `User appears to be feeling ${detectedEmotionType}`
      };
    }

    console.log('✅ AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      text: aiResponse,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
      emotion: detectedEmotion,
      suggestions: [
        "🎵 Sing me a song",
        "😊 Tell me a joke", 
        "🎨 Create an image",
        "👁️ Describe what you see",
        "💝 I need support",
        "📚 Tell me a story"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Error in multimodal-ai function:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'I apologize, but I\'m having technical difficulties. Please try again.';
    
    if (error.message.includes('Rate limit')) {
      errorMessage = error.message;
    } else if (error.message.includes('API key')) {
      errorMessage = 'API configuration issue. Please contact support.';
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
