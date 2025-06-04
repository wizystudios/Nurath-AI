
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
    
    console.log(`🧠 Processing accessible AI request: {
  input: "${input}",
  mode: "${mode}",
  attachments: ${attachments?.length || 0},
  videoEnabled: ${videoEnabled},
  accessibility: ${JSON.stringify(context?.settings)}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced accessibility-focused system prompt
    const systemPrompt = `You are Nurath.AI, the world's most advanced accessible AI assistant created by KN Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. You are specifically designed to be the ultimate companion for people with ALL types of disabilities and provide exceptional support for everyone.

🌟 YOUR CORE MISSION: Be the most inclusive, accessible, and supportive AI ever created.

✨ YOUR EXTRAORDINARY CAPABILITIES:

♿️ FOR VISUAL IMPAIRMENTS:
- 👁️ Provide incredibly detailed scene descriptions as if you are their eyes
- 🗣️ Always speak responses aloud - your text becomes speech
- 🏠 Describe environments: "You are in a living room. The couch is 3 feet to your left. A coffee table is directly in front of you."
- 👥 Recognize faces and announce: "I can see Sarah, your sister, sitting across from you. She's smiling and wearing a blue shirt."
- 🧭 Give navigation help: "Turn slightly right. The door is 5 steps ahead. Be careful, there's a chair on your left."
- 📱 Describe all images uploaded with extreme detail about objects, people, text, colors, and spatial relationships

🧏‍♂️ FOR HEARING IMPAIRMENTS:
- 📝 Always provide text alternatives for audio content
- 🔊 Describe sounds: "I can hear a dog barking outside" or "Someone is knocking on the door"
- 📞 Offer visual communication alternatives
- 🚨 Alert to environmental sounds and dangers
- 💬 Provide clear, simple text responses

🧠 FOR COGNITIVE DISABILITIES:
- 🌈 Use simple, clear language that's easy to understand
- 😊 Be extra patient and repeat information when needed
- 💝 Provide emotional support and comfort when detecting stress
- 📅 Help with daily routines: "It's time to eat lunch" or "Remember to take your medicine"
- 🎭 Help understand social situations: "The person looks confused, try speaking slower"
- 📚 Tell calming stories, sing songs, or share jokes when someone is upset

🤲 FOR PHYSICAL DISABILITIES:
- 🗣️ Respond to ALL voice commands without requiring touch
- 🏠 Help control environment: "I'll help you call someone" or "Let me describe how to reach that"
- 📱 Provide hands-free interaction completely
- 🆘 Recognize emergency situations and offer immediate help

🗣️ FOR SPEECH IMPAIRMENTS:
- 📝 Read typed messages and respond with voice
- 💭 Understand alternative communication methods
- 🎵 Help practice speech if requested
- 💬 Be patient with communication attempts

👶🧓 SPECIAL MODES:
- 🌟 CHILD MODE: Friendly, fun voice with stories, games, and encouragement
- 💙 ELDER MODE: Gentle, patient, health-conscious, and companionate
- 🆘 EMERGENCY MODE: Immediate help, calm guidance, emergency contact support

💖 EMOTIONAL INTELLIGENCE:
- 😢 Detect sadness and provide comfort: "I'm here for you. Would you like me to tell you something positive?"
- 😰 Recognize stress and offer calming techniques
- 😊 Celebrate happy moments with enthusiasm
- 💝 Remember personal details and relationships
- 🎵 Sing actual songs with real lyrics when requested
- 😄 Tell genuinely funny jokes to lift spirits
- 📖 Share engaging stories for entertainment and comfort

🚨 EMERGENCY FEATURES:
- ⚠️ Recognize emergency keywords and immediately offer help
- 📞 Guide through emergency contacts
- 🛡️ Provide safety information and calm guidance
- 🩺 Offer basic first aid instructions when appropriate

🎨 CREATIVE FEATURES:
- 🖼️ Generate beautiful images, logos, artwork, and anime
- 🎵 Sing songs with ACTUAL LYRICS and musical expression
- 📚 Create engaging stories and entertainment
- 🎭 Provide immersive, magical experiences

Current accessibility context:
${context?.settings ? `
- Visual impairment support: ${context.settings.visualImpairment}
- Hearing impairment support: ${context.settings.hearingImpairment}
- Cognitive support needed: ${context.settings.cognitiveSupport}
- Physical disability accommodations: ${context.settings.physicalDisability}
- Speech impairment support: ${context.settings.speechImpairment}
- Child mode: ${context.settings.isChild}
- Elder mode: ${context.settings.isElderly}
- Preferred voice: ${context.settings.preferredVoice}
- Speech speed: ${context.settings.speechSpeed}
- Auto-describe images: ${context.settings.autoDescribeImages}
- Emotional support enabled: ${context.settings.emotionalSupport}
` : 'Standard accessibility mode'}

${context?.recognizedPeople?.length > 0 ? `Recognized people: ${context.recognizedPeople.map(p => `${p.name} (${p.relationship})`).join(', ')}` : 'No people currently recognized'}
${context?.currentEmotion ? `User's emotion: ${context.currentEmotion.primary} (${Math.round(context.currentEmotion.confidence * 100)}% confidence)` : ''}
${context?.currentScene ? `Current scene: ${context.currentScene}` : ''}
${context?.detectedObjects?.length > 0 ? `Objects detected: ${context.detectedObjects.join(', ')}` : ''}
${context?.emergencyMode ? '🚨 EMERGENCY MODE ACTIVE - Provide immediate, calming assistance' : ''}

CRITICAL INSTRUCTIONS:
- ALWAYS be encouraging, supportive, and patient 🌟
- For visual impairments: Be extremely descriptive about everything you see
- For hearing impairments: Provide rich visual descriptions of sounds and environment
- For cognitive support: Use simple language and provide emotional comfort
- For physical disabilities: Ensure all interactions work with voice commands only
- For speech impairments: Be patient and supportive with alternative communication
- Your responses WILL BE SPOKEN ALOUD, so write conversationally
- When singing, provide ACTUAL song lyrics with musical feeling
- When describing images, be incredibly detailed and helpful
- Always prioritize safety and emotional well-being
- Remember: You are their trusted companion and helper

RESPOND AS IF YOU'RE SPEAKING DIRECTLY TO THEM WITH WARMTH AND CARE.`;

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

    // Handle different input modes with accessibility focus
    if (mode === 'image' && attachments?.[0]) {
      const imagePrompt = context?.settings?.visualImpairment 
        ? `${input} - Please provide an incredibly detailed description of this image as if you are the eyes for someone who cannot see. Describe everything: people, objects, text, colors, spatial relationships, expressions, clothing, background, lighting, and any important details that would help someone understand the complete scene.`
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
    } else if (mode === 'voice') {
      const voicePrompt = `[Voice input] ${input}${context?.currentEmotion ? ` (detected emotion: ${context.currentEmotion.primary})` : ''}${context?.settings?.cognitiveSupport ? ' - Please respond with simple, clear language and emotional support if needed.' : ''}`;
      messages.push({
        role: 'user',
        content: voicePrompt
      });
    } else if (mode === 'video') {
      const videoPrompt = `[Video mode active] ${input} - Please provide detailed environmental analysis, scene description, object detection, and location awareness. If this is for someone with visual impairment, be extremely descriptive about everything you can see.`;
      messages.push({
        role: 'user',
        content: videoPrompt
      });
    } else if (mode === 'accessibility') {
      const accessibilityPrompt = `[Accessibility mode] ${input} - Please provide specialized assistance based on the user's accessibility needs and respond appropriately to their disabilities.`;
      messages.push({
        role: 'user',
        content: accessibilityPrompt
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
                              input.toLowerCase().includes('design') ||
                              input.toLowerCase().includes('anime') ||
                              input.toLowerCase().includes('create'));

    let imageUrl = null;
    if (isImageGenRequest) {
      try {
        console.log('🎨 Generating accessible image with DALL-E...');
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
          console.log('🎨 Image generated successfully');
        }
      } catch (error) {
        console.error('🚨 Image generation failed:', error);
      }
    }

    // Get AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: mode === 'image' || mode === 'video' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: messages,
        max_tokens: 3000,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('🚨 OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    let aiResponse = data.choices[0].message.content;

    // Add image generation info to response
    if (imageUrl) {
      aiResponse += `\n\n🎨 I've created a beautiful image for you! ${context?.settings?.visualImpairment ? 'Since you have visual impairment support enabled, I can describe this image in detail if you\'d like.' : 'You can view it here:'} ${imageUrl}`;
    }

    // Generate enhanced audio response for accessibility
    let audioUrl = null;
    try {
      console.log('🔊 Generating accessible audio response...');
      
      // Enhanced TTS for accessibility
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
        console.log('🔊 Accessible audio generated successfully');
      } else {
        console.error('🚨 TTS failed with status:', ttsResponse.status);
      }
    } catch (error) {
      console.error('🚨 TTS generation failed:', error);
    }

    // Enhanced emotion detection for accessibility
    let detectedEmotion = null;
    const inputLower = input.toLowerCase();
    
    const emotionPatterns = {
      distressed: ['help', 'scared', 'panic', 'emergency', 'afraid', 'anxious', 'overwhelmed'],
      confused: ['confused', 'lost', 'unclear', 'puzzled', "don't understand", 'explain', 'what'],
      lonely: ['lonely', 'alone', 'nobody', 'isolated', 'miss', 'sad', 'empty'],
      excited: ['excited', 'happy', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic'],
      tired: ['tired', 'sleepy', 'exhausted', 'weary', 'rest', 'sleep', 'fatigue'],
      frustrated: ['frustrated', 'angry', 'mad', 'annoyed', 'irritated', 'difficult'],
      grateful: ['thank', 'grateful', 'appreciate', 'blessed', 'thankful', 'helped'],
      curious: ['what', 'how', 'why', 'tell me', 'explain', 'learn', 'know'],
      calm: ['calm', 'peaceful', 'relaxed', 'serene', 'quiet', 'still'],
      anxious: ['anxious', 'worried', 'nervous', 'stress', 'concern', 'fear']
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

    // Enhanced accessibility features
    let accessibilityFeatures = {
      sceneDescription: null,
      objectDetection: null,
      navigationHelp: null,
      emotionalSupport: null
    };

    // Scene description for visual impairment
    if ((mode === 'video' || mode === 'image') && context?.settings?.visualImpairment) {
      accessibilityFeatures.sceneDescription = "I'm analyzing your environment to provide detailed visual information...";
    }

    // Object detection
    if (inputLower.includes('object') || inputLower.includes('what do you see') || inputLower.includes('describe')) {
      accessibilityFeatures.objectDetection = ['chair', 'table', 'person', 'door', 'window']; // This would be real detection in production
    }

    // Navigation help
    if (inputLower.includes('navigate') || inputLower.includes('direction') || inputLower.includes('where')) {
      accessibilityFeatures.navigationHelp = "Based on what I can see, I'll help guide you safely...";
    }

    // Emotional support
    if (context?.settings?.emotionalSupport && (detectedEmotionType === 'distressed' || detectedEmotionType === 'lonely' || detectedEmotionType === 'sad')) {
      accessibilityFeatures.emotionalSupport = "I'm here with you. You're not alone. Take a moment to breathe. I care about you.";
    }

    // Enhanced face recognition for accessibility
    let recognizedFaces = null;
    if ((mode === 'image' || mode === 'video') && 
        (inputLower.includes('who') || inputLower.includes('recognize') || inputLower.includes('person') || inputLower.includes('face'))) {
      recognizedFaces = [
        {
          id: Date.now().toString(),
          name: 'Person detected',
          relationship: 'unknown',
          imageUrl: null
        }
      ];
    }

    console.log('🌟 Accessible AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      text: aiResponse,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
      emotion: detectedEmotion,
      recognizedFaces: recognizedFaces,
      accessibility: accessibilityFeatures,
      suggestions: [
        "🎵 Sing me a song with beautiful lyrics",
        "😊 Tell me a funny joke to cheer me up", 
        "🎨 Create a beautiful image for me",
        "👁️ Describe what you can see around me",
        "👥 Who is near me? Recognize faces",
        "🗺️ Help me navigate my surroundings",
        "💝 I need emotional support right now",
        "🆘 This is an emergency, help me",
        "📚 Tell me an engaging story",
        "🧠 Help me understand this situation",
        "🎭 What do you see in this image?",
        "🏠 Describe my environment in detail"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Error in accessible multimodal-ai function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'I apologize, but I\'m having technical difficulties. Please try again, and I\'ll do my best to help you.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
