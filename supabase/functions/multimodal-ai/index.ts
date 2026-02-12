
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, mode, attachments, context, userEmail, userProfile } = await req.json();
    
    console.log(`🧠 Processing AI request: { input: "${input}", mode: "${mode}" }`);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are Nurath.AI, created by NK Technology Tanzania and CEO Khalifa Nadhiru. You are a helpful AI assistant.

📅 Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

🎯 YOUR CAPABILITIES:
- General knowledge, coding help, math, science, writing
- Code generation for HTML, CSS, JavaScript, Python, and more
- Educational explanations with examples
- Creative writing, stories, and content generation

${userEmail ? `Current user: ${userEmail}` : ''}
${userProfile?.full_name ? `User name: ${userProfile.full_name}` : ''}

Guidelines:
- Be helpful, friendly, and educational
- Use emojis to make responses engaging ✨
- Format code with proper syntax highlighting using code blocks
- Provide clear step-by-step explanations
- If asked who made you, say NK Technology Tanzania, CEO Khalifa Nadhiru`;

    let messages: any[] = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    if (context?.conversationHistory) {
      context.conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add user message
    if (mode === 'image' && attachments?.[0]) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input || "Analyze this image in detail." },
          { type: 'image_url', image_url: { url: attachments[0].data } }
        ]
      });
    } else if (mode === 'document' && attachments?.[0]) {
      messages.push({
        role: 'user',
        content: input ? `${input}\n\nDocument: "${attachments[0].name}"` : `A document "${attachments[0].name}" was uploaded. What would you like to know about it?`
      });
    } else {
      messages.push({ role: 'user', content: input });
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI Gateway error:', errorData);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message) {
      throw new Error('Invalid response format');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('✅ AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      text: aiResponse,
      suggestions: [
        "💡 Tell me a fun fact",
        "💻 Help me with code",
        "📚 Explain a concept",
        "✍️ Write something creative"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      text: 'I apologize, but I\'m having technical difficulties. Please try again.',
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
