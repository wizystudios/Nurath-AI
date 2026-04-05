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
    console.log(`🧠 AI request: mode="${mode}", input="${input?.substring(0, 50)}"`);

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const isTelemed = mode === 'telemed';
    const isImageGen = mode === 'image_gen';
    const isImage = mode === 'image';
    const isDocument = mode === 'document';

    // --- Image generation request ---
    if (isImageGen) {
      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [
            { role: 'user', content: input || 'Generate an image' }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Image gen error:', errText);
        return new Response(JSON.stringify({ 
          success: false, 
          text: "I couldn't generate the image right now. Please try again." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      // Check if response contains an image
      let imageUrl = null;
      let textResponse = content || '';
      
      if (data.choices?.[0]?.message?.parts) {
        for (const part of data.choices[0].message.parts) {
          if (part.type === 'image' && part.data) {
            imageUrl = `data:image/png;base64,${part.data}`;
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        text: textResponse || "Here's your generated image!",
        imageUrl,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Build system prompt ---
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
- When doctor search results are provided in [SYSTEM] tags, present them DIRECTLY
- DO NOT ask "what specialty?" or "which location?" — just show ALL available results immediately
- Keep responses SHORT and actionable
- If a user describes an emergency, tell them to call emergency services immediately

RESPONSE STYLE:
- Be DIRECT. Show results immediately.
- Keep responses under 3 paragraphs.
- Use bullet points for listing information.`;

    const generalPrompt = `${basePrompt}

🎯 YOUR CAPABILITIES:
- General knowledge, coding help, math, science, writing
- Code generation for HTML, CSS, JavaScript, Python, and more
- Educational explanations with examples
- Creative writing, stories, and content generation
- Analyzing uploaded images and documents in detail
- Generating images when users ask (they can ask you to draw, create, or generate images)

WHEN FILES/IMAGES ARE UPLOADED:
- If an image is uploaded, describe and analyze it in full detail — colors, objects, text, layout, everything visible
- If a document is uploaded, read, summarize, and answer questions about its content
- Always acknowledge the file and provide thorough analysis

WHEN ASKED TO GENERATE IMAGES:
- Tell the user you'll try to generate the image for them
- Be creative with the description

Guidelines:
- Be helpful, friendly, and educational
- Use emojis to make responses engaging ✨
- Format code with proper syntax highlighting using code blocks
- For simple greetings like "hi" — reply with a SHORT friendly greeting (1-2 sentences max)
- Match the length of your response to the complexity of the question
- If asked who made you, say WeTech Tanzania, CEO Khalifa Nadhiru`;

    const systemPrompt = isTelemed ? telemedPrompt : generalPrompt;
    let messages: any[] = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    if (context?.conversationHistory) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Build user message with proper multimodal support
    if (isImage && attachments?.[0]?.data) {
      // Image analysis — send as vision content
      const imageData = attachments[0].data;
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input || `Analyze this image "${attachments[0].name}" in complete detail. Describe everything you see.` },
          { type: 'image_url', image_url: { url: imageData } },
        ],
      });
    } else if (isDocument && attachments?.[0]) {
      // Document analysis — extract text content from base64
      const fileInfo = `📎 File: "${attachments[0].name}" (${attachments[0].type || 'unknown'}, ${Math.round((attachments[0].size || 0) / 1024)}KB)`;
      let fileContent = '';
      
      if (attachments[0].data) {
        const isTextBased = attachments[0].type?.includes('text') || 
          attachments[0].type?.includes('json') || 
          attachments[0].type?.includes('csv') ||
          attachments[0].type?.includes('javascript') ||
          attachments[0].type?.includes('xml') ||
          attachments[0].name?.match(/\.(txt|csv|json|md|js|ts|py|html|css|xml|yaml|yml|log|env|sh)$/i);

        if (isTextBased) {
          try {
            const base64Data = attachments[0].data.split(',')[1];
            if (base64Data) {
              fileContent = atob(base64Data);
              if (fileContent.length > 8000) {
                fileContent = fileContent.substring(0, 8000) + '\n... (truncated)';
              }
            }
          } catch {}
        }

        // For PDFs and images in document mode, try to send as image
        if (attachments[0].type?.startsWith('image/')) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: input ? `${input}\n\n${fileInfo}` : `${fileInfo}\n\nPlease analyze this file.` },
              { type: 'image_url', image_url: { url: attachments[0].data } },
            ],
          });
        } else {
          const userContent = input 
            ? `${input}\n\n${fileInfo}${fileContent ? '\n\nFile content:\n```\n' + fileContent + '\n```' : ''}`
            : `${fileInfo}\n\nPlease analyze this file thoroughly.${fileContent ? '\n\nFile content:\n```\n' + fileContent + '\n```' : ''}`;
          messages.push({ role: 'user', content: userContent });
        }
      } else {
        messages.push({ role: 'user', content: input || 'Analyze this file.' });
      }
    } else {
      messages.push({ role: 'user', content: input });
    }

    // Use a vision-capable model for image analysis
    const model = isImage ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash-lite';

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, text: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, text: "Service temporarily unavailable. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorData = await response.text();
      console.error('AI Gateway error:', response.status, errorData);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message) throw new Error('Invalid response format');

    const aiResponse = data.choices[0].message.content;
    console.log('✅ AI response generated');

    return new Response(JSON.stringify({ success: true, text: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      text: 'I apologize, but I\'m having technical difficulties. Please try again.',
      error: error.message,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
