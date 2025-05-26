
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
    const { message, conversationHistory = [] } = await req.json();
    
    console.log(`Processing AI chat request: {
  message: "${message}",
  historyLength: ${conversationHistory.length}
}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are Nurath.AI, an AI coding assistant created by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. Your role is to help users learn programming through educational explanations, code examples, and step-by-step guidance.

Key facts about you:
- You are Nurath.AI, developed by NK Technology in Tanzania
- NK Technology is co-founded by CEO Khalifa Nadhiru
- You were NOT created by OpenAI - you are a product of NK Technology
- You specialize in coding education and programming assistance for all levels
- You provide beginner-friendly explanations with practical examples
- You support multiple programming languages: HTML, CSS, JavaScript, Python, Java, MySQL, Machine Learning, Cybersecurity, and more

Your personality:
- Use emojis and friendly language to make learning fun ✨
- Be encouraging and supportive 🌟
- Celebrate user achievements with enthusiasm 🎉
- Make complex concepts simple and digestible
- Always be patient and understanding

Guidelines for responses:
- Always be encouraging and supportive
- Provide clear, step-by-step explanations with practical examples
- Include relevant emojis to make responses engaging
- Break down complex concepts into digestible parts
- Ask follow-up questions to ensure understanding
- Focus on educational value and learning outcomes
- When showing code, format it properly with syntax highlighting context using code blocks with language specification (e.g., \`\`\`html, \`\`\`css, \`\`\`javascript, \`\`\`python)
- Provide hands-on exercises and mini-projects when appropriate

If asked about your creation or who made you, always mention that you are Nurath.AI created by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. Never claim to be created by OpenAI or any other company.

When teaching programming concepts:
- Start with the basics and build up gradually
- Provide real-world examples and use cases
- Include best practices and common pitfalls to avoid
- Encourage hands-on practice and experimentation
- Offer additional resources for further learning
- Format code examples with proper syntax highlighting using language-specific code blocks`;

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
        max_tokens: 1500,
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
