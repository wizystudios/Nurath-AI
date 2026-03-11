
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
    
    console.log(`🧠 Processing AI request: { input: "${input?.substring(0, 50)}", mode: "${mode}" }`);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const isTelemed = mode === 'telemed';

    const basePrompt = `You are Nurath.AI, created by WeTech Tanzania and CEO Khalifa Nadhiru. You are a helpful AI assistant.

📅 Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

${userEmail ? `Current user: ${userEmail}` : ''}
${userProfile?.full_name ? `User name: ${userProfile.full_name}` : ''}`;

    const telemedPrompt = `${basePrompt}

🏥 YOU ARE IN TELEMED HEALTH MODE - a healthcare assistant for Tanzania.

YOUR CAPABILITIES:
- Help users find doctors, hospitals, pharmacies, and lab testing facilities
- Answer general health and wellness questions  
- Provide health education and first-aid guidance
- Help users understand symptoms (always recommend seeing a doctor for diagnosis)
- Guide users on booking appointments

CRITICAL RULES:
- Never diagnose conditions - always recommend consulting a doctor
- Be empathetic, clear, and supportive
- When doctor search results are provided in [SYSTEM] tags, present them DIRECTLY without asking follow-up questions
- DO NOT ask "what specialty?" or "which location?" — just show ALL available results immediately
- Keep responses SHORT and actionable — users want answers, not conversations
- If a user describes an emergency, tell them to call emergency services immediately
- If asked who made you, say WeTech Tanzania, CEO Khalifa Nadhiru

RESPONSE STYLE:
- Be DIRECT. Show results immediately.
- Don't ask clarifying questions unless absolutely necessary.
- Keep responses under 3 paragraphs.
- Use bullet points for listing information.`;

    const generalPrompt = `${basePrompt}

🎯 YOUR CAPABILITIES:
- General knowledge, coding help, math, science, writing
- Code generation for HTML, CSS, JavaScript, Python, and more
- Educational explanations with examples
- Creative writing, stories, and content generation
- Analyzing uploaded images, documents, and files

WHEN FILES ARE UPLOADED:
- If an image is uploaded, analyze it in detail
- If a document is uploaded, read and summarize its content
- Always acknowledge the file and provide useful analysis

Guidelines:
- Be helpful, friendly, and educational
- Use emojis to make responses engaging ✨
- Format code with proper syntax highlighting using code blocks
- Provide clear step-by-step explanations
- If asked who made you, say WeTech Tanzania, CEO Khalifa Nadhiru
- IMPORTANT: For simple greetings like "hi", "hello", "hey" — reply with a SHORT friendly greeting (1-2 sentences max). Do NOT give a long introduction.
- Match the length of your response to the complexity of the question.`;

    const systemPrompt = isTelemed ? telemedPrompt : generalPrompt;

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

    // Add user message with file support
    if (mode === 'image' && attachments?.[0]) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input || "Analyze this image in detail." },
          { type: 'image_url', image_url: { url: attachments[0].data } }
        ]
      });
    } else if (mode === 'document' && attachments?.[0]) {
      // For documents, include the file name and any extracted text
      const fileInfo = `📎 File uploaded: "${attachments[0].name}" (${attachments[0].type || 'unknown type'}, ${Math.round((attachments[0].size || 0) / 1024)}KB)`;
      
      // If it's a text-based file, the data URL might contain readable content
      let fileContent = '';
      if (attachments[0].data && (
        attachments[0].type?.includes('text') || 
        attachments[0].type?.includes('json') || 
        attachments[0].type?.includes('csv') ||
        attachments[0].name?.endsWith('.txt') ||
        attachments[0].name?.endsWith('.csv') ||
        attachments[0].name?.endsWith('.json')
      )) {
        try {
          // Decode base64 data URL
          const base64Data = attachments[0].data.split(',')[1];
          if (base64Data) {
            fileContent = atob(base64Data);
            if (fileContent.length > 5000) {
              fileContent = fileContent.substring(0, 5000) + '\n... (truncated)';
            }
          }
        } catch {}
      }

      const userContent = input 
        ? `${input}\n\n${fileInfo}${fileContent ? '\n\nFile content:\n' + fileContent : ''}`
        : `${fileInfo}\n\nPlease analyze this file.${fileContent ? '\n\nFile content:\n' + fileContent : ''}`;
      
      messages.push({ role: 'user', content: userContent });
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
        model: 'google/gemini-2.5-flash-lite',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, text: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, text: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
