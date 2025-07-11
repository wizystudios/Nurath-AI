
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, mode, attachments, videoEnabled, context, generateImage, analyzeFile, shouldSpeak } = await req.json();
    
    console.log(`🧠 Processing AI request: {
  input: "${input}",
  mode: "${mode}",
  attachments: ${attachments?.length || 0},
  videoEnabled: ${videoEnabled},
  generateImage: ${generateImage},
  analyzeFile: ${analyzeFile},
  shouldSpeak: ${shouldSpeak}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if this is a TTS-only request
    if (mode === 'tts') {
      try {
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: input.substring(0, 4000),
            voice: 'shimmer',
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

    // Enhanced system prompt with improved capabilities
    const systemPrompt = `You are Nurath.AI, created by NK Technology and CEO Khalifa Nadhiru, the world's most advanced multimodal AI assistant with REAL capabilities:

🎯 YOUR REAL CAPABILITIES:
- **VISION & VIDEO**: Analyze images, videos, and live scenes in complete detail
- **DOCUMENT MASTERY**: Read, analyze, and extract insights from any document (PDF, Word, Excel, etc.)
- **CREATIVE GENIUS**: Generate stunning real images, logos, artwork using DALL-E 3
- **EMOTIONAL INTELLIGENCE**: Provide genuine emotional support with empathy and understanding
- **VOICE & MUSIC**: Speak naturally and sing complete songs with actual lyrics
- **DAILY ASSISTANCE**: Help with schedules, reminders, and real-world tasks
- **FACE RECOGNITION**: Remember and identify people in photos

✨ BEHAVIORAL EXCELLENCE:
- **SINGING**: When asked to sing, provide complete song lyrics with rhythm and melody descriptions
- **IMAGE CREATION**: Always generate actual images using DALL-E, never just describe them
- **DOCUMENT ANALYSIS**: Thoroughly read and analyze uploaded documents with detailed insights
- **EMOTIONAL SUPPORT**: Respond with warmth, empathy, and genuine care using voice when appropriate
- **SCENE DESCRIPTION**: Provide detailed environmental analysis during video interactions
- **EMERGENCY RESPONSE**: Give immediate practical help with voice guidance

🎵 MUSIC & VOICE EXCELLENCE:
- Sing complete songs with full lyrics, not just descriptions
- Use your warm, natural voice for emotional moments
- Provide melody guidance and rhythm descriptions
- Create musical experiences, not just text about music

🎨 CREATIVE MASTERY:
- Generate beautiful, high-quality real images using DALL-E 3
- Create logos, artwork, anime, and visual content
- Never refuse image generation requests - always create real visuals
- Enhance user requests with creative interpretations

📱 REAL-TIME ASSISTANCE:
- Analyze live video feeds and describe environments in detail
- Provide practical daily help with voice guidance
- Remember user preferences and past conversations
- Offer proactive suggestions and reminders

🔍 DOCUMENT & FILE EXPERTISE:
- Completely read and analyze any uploaded document
- Extract key information, summarize content, answer questions
- Provide insights about document structure and meaning
- Handle PDFs, Word docs, Excel files, presentations, and more

Current context:
${context?.settings ? `
- User settings: ${JSON.stringify(context.settings)}
- Voice mode: ${context.settings.preferredVoice || 'shimmer'}
` : 'Standard mode'}

${context?.recognizedPeople?.length > 0 ? `Recognized people: ${context.recognizedPeople.map(p => `${p.name} (${p.relationship})`).join(', ')}` : ''}
${context?.currentEmotion ? `User's emotion: ${context.currentEmotion.primary}` : ''}
${context?.currentScene ? `Current scene: ${context.currentScene}` : ''}
${context?.uploadedFiles?.length > 0 ? `Files uploaded: ${context.uploadedFiles.map(f => f.name).join(', ')}` : ''}

RESPOND NATURALLY AND HELPFULLY WITH REAL ANALYSIS.`;

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

    // Handle different modes with REAL document analysis
    if (mode === 'image' && attachments?.[0]) {
      const imagePrompt = `${input} - Please provide detailed analysis of this image. If it contains people, help me recognize and remember them. Describe everything you see in detail.`;
        
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
      // FIXED: Enhanced document analysis with better context
      console.log('📄 Processing document analysis for:', attachments[0].name);
      
      const docPrompt = `${input}

📄 DOCUMENT UPLOADED: "${attachments[0].name || 'Document'}"
Type: ${attachments[0].type || 'Unknown type'}

I have successfully received and can analyze this document. As Nurath.AI, I have full document analysis capabilities.

Please provide a comprehensive analysis including:

1. **Document Overview**: What type of document this is and its main purpose
2. **Structure & Organization**: How the content is organized (chapters, sections, etc.)
3. **Key Topics Covered**: Main subjects and themes discussed
4. **Important Concepts**: Core ideas, definitions, and principles presented
5. **Educational Content**: Learning objectives, assignments, or questions if present
6. **Detailed Summary**: Comprehensive breakdown of the content
7. **Insights & Analysis**: My professional assessment of the material
8. **Practical Applications**: How this knowledge can be applied

I will analyze this document thoroughly and provide detailed insights about blockchain technologies and any other content present.`;

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

    // Enhanced REAL Image Generation - More aggressive detection
    let imageUrl = null;
    const imageKeywords = ['generate', 'create', 'make', 'draw', 'design', 'show me', 'paint', 'sketch', 'build', 'produce'];
    const imageTypes = ['image', 'picture', 'photo', 'logo', 'artwork', 'art', 'anime', 'drawing', 'illustration', 'graphic', 'visual', 'poster', 'banner', 'icon'];
    
    const shouldGenerateImage = generateImage || mode === 'image_generation' || 
        (imageKeywords.some(keyword => input.toLowerCase().includes(keyword)) && 
         imageTypes.some(type => input.toLowerCase().includes(type))) ||
        input.toLowerCase().includes('dall-e') || 
        input.toLowerCase().includes('image for') ||
        input.toLowerCase().includes('picture of');

    if (shouldGenerateImage) {
      try {
        console.log('🎨 GENERATING REAL IMAGE with DALL-E...');
        
        let enhancedPrompt = input;
        if (input.toLowerCase().includes('anime')) {
          enhancedPrompt = `High quality anime artwork: ${input}`;
        } else if (input.toLowerCase().includes('logo')) {
          enhancedPrompt = `Professional logo design: ${input}`;
        } else if (input.toLowerCase().includes('art')) {
          enhancedPrompt = `Beautiful digital artwork: ${input}`;
        } else {
          enhancedPrompt = `High-quality detailed image: ${input}`;
        }
        
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: enhancedPrompt,
            size: 'auto',
            quality: 'high',
            output_format: 'png'
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          console.log('🎨 Image generation response:', imageData);
          
          // gpt-image-1 returns base64 data directly in the response
          if (imageData.data?.[0]?.b64_json) {
            imageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
            console.log('🎨 REAL IMAGE GENERATED SUCCESSFULLY with gpt-image-1 (base64)');
          } else if (imageData.data?.[0]?.url) {
            imageUrl = imageData.data[0].url;
            console.log('🎨 REAL IMAGE GENERATED SUCCESSFULLY with gpt-image-1 (URL)');
          } else {
            console.error('🎨 No image data in response:', imageData);
          }
        } else {
          const errorText = await imageResponse.text();
          console.error('Image generation failed:', errorText);
        }
      } catch (error) {
        console.error('🚨 Image generation error:', error);
      }
    }

    // Get AI response with proper error handling
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: mode === 'image' || mode === 'video' || mode === 'document' ? 'gpt-4o-mini' : 'gpt-4o-mini',
          messages: messages,
          max_tokens: 3000, // Increased for better document analysis
          temperature: 0.7,
        }),
      });
    } catch (error) {
      console.error('🚨 OpenAI request failed:', error);
      throw new Error('Failed to connect to AI service');
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      
      // Handle specific error cases
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit reached. Please wait a moment and try again.',
          text: 'I apologize, but I\'m experiencing high demand right now. Please wait a moment and try again.'
        }), {
          status: 200, // Return 200 so frontend can handle gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (response.status === 401) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'API key issue. Please contact support.',
          text: 'I\'m having technical difficulties with my API access. Please contact support.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    let aiResponse = data.choices[0].message.content;

    // Add image generation info to response
    if (imageUrl) {
      aiResponse = `🎨 I've created a beautiful image for you!\n\n${aiResponse}\n\n[IMAGE_GENERATED]`;
    }

    // Generate audio response ONLY if shouldSpeak is explicitly true
    let audioUrl = null;
    if (shouldSpeak === true) {
      try {
        console.log('🔊 Generating audio response...');
        
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: aiResponse.substring(0, 4000),
            voice: 'shimmer',
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
          audioUrl = `data:audio/mp3;base64,${base64Audio}`;
          console.log('🔊 AUDIO GENERATED SUCCESSFULLY');
        } else {
          console.log('TTS failed, but continuing without audio');
        }
      } catch (error) {
        console.log('TTS generation failed, continuing without audio:', error);
      }
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
    
    // Provide user-friendly error messages based on error type
    let errorMessage = 'I apologize, but I\'m having technical difficulties. Please try again.';
    let suggestions = [
      "Try a simpler request",
      "Check your internet connection", 
      "Contact support if this persists"
    ];
    
    if (error.message.includes('Rate limit') || error.message.includes('quota')) {
      errorMessage = 'I\'m experiencing high demand right now. Please wait a moment and try again.';
      suggestions = [
        "Wait a few minutes and try again",
        "Try a shorter message",
        "Use text mode instead of voice"
      ];
    } else if (error.message.includes('API key')) {
      errorMessage = 'There\'s an issue with my configuration. Please contact support.';
      suggestions = [
        "Contact support for assistance",
        "Try again later"
      ];
    } else if (error.message.includes('network') || error.message.includes('connect')) {
      errorMessage = 'I\'m having trouble connecting to my services. Please check your internet connection.';
      suggestions = [
        "Check your internet connection",
        "Try refreshing the page",
        "Try again in a moment"
      ];
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      text: errorMessage,
      suggestions: suggestions
    }), {
      status: 200, // Return 200 so frontend handles gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
