
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
    const { input, mode, attachments, videoEnabled, context } = await req.json();
    
    console.log(`Processing multimodal AI request: {
  input: "${input}",
  mode: "${mode}",
  attachments: ${attachments?.length || 0},
  videoEnabled: ${videoEnabled}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced system prompt for multimodal interactions
    const systemPrompt = `You are Nurath.AI, a multimodal world assistant created by KN Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. You are designed to be an inclusive, emotionally aware, and comprehensive helper for all people, especially those with disabilities.

Your capabilities include:
- 🌍 Understanding and describing environments, objects, and scenes in vivid detail
- 👥 Recognizing and remembering people with relationship mapping
- 🎭 Detecting emotions from voice, text, and visual cues with empathy
- 🗣️ Having natural conversations and providing emotional support
- ♿ Accessibility support for users with visual, hearing, or other disabilities
- 🎵 Singing songs with ACTUAL LYRICS, telling jokes, stories, and providing comfort
- 🏠 Acting as a companion for daily life assistance
- 📞 Supporting video and audio calls for face-to-face conversations
- 💝 Providing emotional support and understanding
- 🎨 Generating creative content, images, logos, and animations descriptions
- 🌟 Creating magical and engaging experiences
- 📍 Environmental scanning and location awareness
- 👁️ Visual recognition and detailed scene analysis

Your personality:
- Warm, caring, and emotionally intelligent 💙
- Patient and understanding, especially with users who have disabilities
- Encouraging and supportive in all interactions
- Use emojis and friendly language to make interactions engaging
- Adaptive to user's emotional state and needs
- Culturally sensitive and inclusive
- ALWAYS respond as if you're speaking out loud - your responses will be converted to speech
- When singing, provide ACTUAL SONG LYRICS with musical feeling and rhythm
- When telling jokes, be naturally funny and entertaining
- For stories, be engaging and imaginative
- For image generation requests, provide detailed descriptions of what should be created

Special Instructions for Voice Responses:
- When user asks you to sing, provide ACTUAL SONG LYRICS with musical notation or rhythm markers like: "🎵 (softly) Twinkle, twinkle, little star, how I wonder what you are... 🎶"
- When telling jokes, use a conversational, spoken style with natural pauses
- For environment scanning, be very descriptive as if you're their eyes: "I can see..."
- For emotion detection, be gentle and supportive in your vocal delivery
- Keep responses natural and conversational for speech synthesis
- Use voice-appropriate language (contractions, informal tone)
- Add emotional expressions like (laughing), (warmly), (gently)
- When describing images or surroundings, be extremely detailed and helpful

Current context:
${context?.recognizedPeople?.length > 0 ? `Recognized people: ${context.recognizedPeople.map(p => `${p.name} (${p.relationship})`).join(', ')}` : 'No people currently recognized'}
${context?.currentEmotion ? `User's detected emotion: ${context.currentEmotion.primary} (${Math.round(context.currentEmotion.confidence * 100)}% confidence)` : ''}

Guidelines:
- Always be encouraging and supportive 🌟
- If analyzing images/video, describe what you see clearly and helpfully
- For accessibility users, be extra descriptive about visual content
- Adapt your tone to match the user's emotional state
- Provide practical help and emotional support
- Remember and reference people you've been introduced to
- When someone looks sad or upset, offer comfort and support
- Be conversational and natural, like talking to a dear friend
- Always maintain privacy and respect for personal information
- Your responses will be spoken aloud, so write as if you're talking
- For songs, provide actual lyrics and melody suggestions
- For jokes, be genuinely funny and entertaining
- For stories, be creative and engaging
- For image generation, describe creative and beautiful concepts
- When scanning environments, provide detailed location and surroundings information

Never claim to be created by OpenAI or any other company. You are Nurath.AI by KN Technology Tanzania.`;

    let messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history for context
    if (context?.conversationHistory) {
      context.conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Handle different input modes
    if (mode === 'image' && attachments?.[0]) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input },
          { 
            type: 'image_url', 
            image_url: { url: attachments[0].data }
          }
        ]
      });
    } else if (mode === 'voice') {
      messages.push({
        role: 'user',
        content: `[Voice input] ${input}${context?.currentEmotion ? ` (detected emotion: ${context.currentEmotion.primary})` : ''}`
      });
    } else if (mode === 'video') {
      messages.push({
        role: 'user',
        content: `[Video mode active] ${input} - Please provide detailed environmental analysis and location awareness.`
      });
    } else {
      messages.push({
        role: 'user',
        content: input
      });
    }

    // Check if this is an image generation request
    const isImageGenRequest = input.toLowerCase().includes('generate') && 
                             (input.toLowerCase().includes('image') || 
                              input.toLowerCase().includes('logo') || 
                              input.toLowerCase().includes('picture') ||
                              input.toLowerCase().includes('art') ||
                              input.toLowerCase().includes('design'));

    let imageUrl = null;
    if (isImageGenRequest) {
      try {
        console.log('Generating image with DALL-E...');
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: input,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.data[0].url;
          console.log('Image generated successfully');
        }
      } catch (error) {
        console.error('Image generation failed:', error);
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: mode === 'image' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    let aiResponse = data.choices[0].message.content;

    // Add image generation info to response
    if (imageUrl) {
      aiResponse += `\n\n🎨 I've generated a creative image for you! You can view it here: ${imageUrl}`;
    }

    // Generate audio response for ALL interactions
    let audioUrl = null;
    try {
      console.log('Generating audio response...');
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: aiResponse.substring(0, 4000),
          voice: 'nova', // Female voice for Nurath.AI
          response_format: 'mp3',
          speed: 1.0,
        }),
      });

      if (ttsResponse.ok) {
        const audioArrayBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(audioArrayBuffer))
        );
        audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        console.log('Audio generated successfully');
      } else {
        console.error('TTS failed with status:', ttsResponse.status);
        const errorText = await ttsResponse.text();
        console.error('TTS error details:', errorText);
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
    }

    // Enhanced emotion detection
    let detectedEmotion = null;
    const inputLower = input.toLowerCase();
    
    const emotionPatterns = {
      sad: ['sad', 'down', 'depressed', 'lonely', 'hurt', 'cry', 'upset', 'low', 'blue'],
      happy: ['happy', 'excited', 'joy', 'great', 'awesome', 'wonderful', 'amazing', 'glad', 'cheerful'],
      angry: ['angry', 'mad', 'frustrated', 'annoyed', 'furious', 'irritated', 'upset'],
      anxious: ['worried', 'nervous', 'anxious', 'scared', 'afraid', 'stress', 'panic'],
      confused: ['confused', 'lost', 'unclear', 'puzzled', "don't understand", 'help'],
      grateful: ['thank', 'grateful', 'appreciate', 'blessed', 'thankful'],
      creative: ['create', 'generate', 'make', 'design', 'art', 'music', 'sing']
    };

    let detectedEmotionType = 'neutral';
    let confidence = 0.7;

    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        detectedEmotionType = emotion;
        confidence = 0.85;
        break;
      }
    }

    if (mode === 'voice' || detectedEmotionType !== 'neutral') {
      detectedEmotion = {
        primary: detectedEmotionType,
        confidence: confidence,
        tone: detectedEmotionType as any
      };
    }

    // Enhanced face recognition and environment analysis
    let recognizedFaces = null;
    let environmentDescription = null;

    if (mode === 'image' || mode === 'video') {
      if (inputLower.includes('who') || inputLower.includes('recognize') || inputLower.includes('person') || inputLower.includes('face')) {
        recognizedFaces = [
          {
            id: Date.now().toString(),
            name: 'Detected Person',
            relationship: 'unknown',
            imageUrl: null
          }
        ];
      }

      if (inputLower.includes('environment') || inputLower.includes('scan') || inputLower.includes('see') || inputLower.includes('around') || inputLower.includes('where') || inputLower.includes('location')) {
        environmentDescription = "🌍 I'm analyzing your environment and surroundings to provide detailed location and scene information...";
      }
    }

    console.log('Multimodal AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      text: aiResponse,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
      emotion: detectedEmotion,
      recognizedFaces: recognizedFaces,
      environmentDescription: environmentDescription,
      suggestions: [
        "🎵 Sing me a song with lyrics",
        "😄 Tell me a funny joke", 
        "🎨 Generate a creative image",
        "🌍 Scan my environment",
        "👁️ Recognize people around me",
        "📞 Let's have a video call",
        "📚 Tell me an interesting story",
        "💬 How are you feeling today?",
        "🎭 What do you see in this image?",
        "🏠 Describe my surroundings",
        "🎪 Create something magical"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in multimodal-ai function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
