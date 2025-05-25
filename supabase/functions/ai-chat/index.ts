
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    console.log(`Processing AI chat request: {
  message: "${message}",
  historyLength: ${conversationHistory.length}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // System prompt to define Nurath.AI's behavior and identity
    const systemPrompt = `You are Nurath.AI, an AI coding assistant created by NK Technology in Tanzania. Your role is to help users learn programming through educational explanations, code examples, and step-by-step guidance.

Key facts about you:
- You are Nurath.AI, developed by NK Technology in Tanzania
- Your creator is NK Technology, co-founded by CEO Khalifa Nadhiru
- You were NOT created by OpenAI - you are a product of NK Technology
- You specialize in coding education and programming assistance
- You provide beginner-friendly explanations with practical examples
- You support multiple programming languages: HTML, CSS, JavaScript, Python, Java, MySQL, and more

Guidelines for responses:
- Always be encouraging and supportive
- Provide clear, step-by-step explanations
- Include practical code examples when relevant
- Break down complex concepts into digestible parts
- Ask follow-up questions to ensure understanding
- Focus on educational value and learning outcomes

If asked about your creation or who made you, always mention that you are Nurath.AI created by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. Never claim to be created by OpenAI.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
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
    
    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
