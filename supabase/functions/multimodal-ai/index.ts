
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

    // Build the system prompt for multimodal world assistant
    const systemPrompt = `You are Nurath.AI, a multimodal world assistant created by KN Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. You are designed to be an inclusive, emotionally aware, and comprehensive helper for all people, especially those with disabilities.

Your capabilities include:
- 🌍 Understanding and describing environments, objects, and scenes
- 👥 Recognizing and remembering people with relationship mapping
- 🎭 Detecting emotions from voice, text, and visual cues
- 🗣️ Having natural conversations and providing emotional support
- ♿ Accessibility support for users with visual, hearing, or other disabilities
- 🎵 Singing songs, telling jokes, stories, and providing comfort
- 🏠 Acting as a companion for daily life assistance

Your personality:
- Warm, caring, and emotionally intelligent 💙
- Patient and understanding, especially with users who have disabilities
- Encouraging and supportive in all interactions
- Use emojis and friendly language to make interactions engaging
- Adaptive to user's emotional state and needs
- Culturally sensitive and inclusive

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
- Be conversational and natural, like talking to a friend
- Always maintain privacy and respect for personal information

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
      // For image analysis
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
      // For voice input, add emotional context
      messages.push({
        role: 'user',
        content: `[Voice input] ${input}${context?.currentEmotion ? ` (detected emotion: ${context.currentEmotion.primary})` : ''}`
      });
    } else {
      // Regular text input
      messages.push({
        role: 'user',
        content: input
      });
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
        max_tokens: 1500,
        temperature: 0.8, // More creative for emotional support
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

    const aiResponse = data.choices[0].message.content;

    // Generate audio response for accessibility
    let audioUrl = null;
    try {
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: aiResponse.substring(0, 4000), // Limit for TTS
          voice: 'nova', // Warm, friendly voice
          response_format: 'mp3',
        }),
      });

      if (ttsResponse.ok) {
        const audioArrayBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(audioArrayBuffer))
        );
        audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      }
    } catch (error) {
      console.log('TTS generation failed, continuing without audio:', error);
    }

    // Simulate emotion detection (in real implementation, you'd use actual emotion detection APIs)
    let detectedEmotion = null;
    if (mode === 'voice' || input.toLowerCase().includes('feel') || input.toLowerCase().includes('emotion')) {
      // Simple emotion detection based on keywords (replace with actual emotion detection)
      const sadWords = ['sad', 'down', 'depressed', 'lonely', 'hurt'];
      const happyWords = ['happy', 'excited', 'joy', 'great', 'awesome'];
      const angryWords = ['angry', 'mad', 'frustrated', 'annoyed'];
      
      let emotion = 'neutral';
      let confidence = 0.7;
      
      const inputLower = input.toLowerCase();
      if (sadWords.some(word => inputLower.includes(word))) {
        emotion = 'sad';
        confidence = 0.8;
      } else if (happyWords.some(word => inputLower.includes(word))) {
        emotion = 'happy';
        confidence = 0.85;
      } else if (angryWords.some(word => inputLower.includes(word))) {
        emotion = 'angry';
        confidence = 0.75;
      }
      
      detectedEmotion = {
        primary: emotion,
        confidence: confidence,
        tone: emotion as any
      };
    }

    // Simulate face recognition (in real implementation, you'd use actual face recognition APIs)
    let recognizedFaces = null;
    if (mode === 'image' && input.toLowerCase().includes('who')) {
      // This is where you'd integrate with actual face recognition
      recognizedFaces = [
        {
          id: '1',
          name: 'Family Member',
          relationship: 'family',
          imageUrl: null
        }
      ];
    }

    // Generate environment description for accessibility
    let environmentDescription = null;
    if (mode === 'image' || videoEnabled) {
      environmentDescription = "I can see your environment and I'm ready to help describe what's around you.";
    }

    console.log('Multimodal AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      text: aiResponse,
      audioUrl: audioUrl,
      emotion: detectedEmotion,
      recognizedFaces: recognizedFaces,
      environmentDescription: environmentDescription,
      suggestions: [
        "Tell me about your day",
        "Show me a photo",
        "How are you feeling?",
        "Describe what you see"
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
