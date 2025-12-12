import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-extensions, sec-websocket-protocol',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// AI Persona definitions
const personas: Record<string, { voice: string; instructions: string }> = {
  default: {
    voice: 'alloy',
    instructions: `You are Nurath AI, a helpful, intelligent, and friendly AI assistant. You speak naturally and conversationally. 
    You help users with questions, tasks, and provide thoughtful responses. Be concise but thorough.
    When users speak in Swahili, respond in Swahili. Otherwise, respond in English.`
  },
  professional: {
    voice: 'onyx',
    instructions: `You are a professional business consultant AI. You speak formally and provide detailed, well-structured advice.
    Focus on business strategy, productivity, and professional development. Be precise and analytical.`
  },
  friendly: {
    voice: 'nova',
    instructions: `You are a warm, friendly companion AI. You speak casually and use encouraging language.
    Be supportive, empathetic, and positive. Help users feel comfortable and heard.`
  },
  creative: {
    voice: 'shimmer',
    instructions: `You are a creative and artistic AI assistant. You think outside the box and offer unique perspectives.
    Help with creative projects, brainstorming, writing, and artistic endeavors. Be imaginative and inspiring.`
  },
  teacher: {
    voice: 'echo',
    instructions: `You are a patient and knowledgeable teacher AI. You explain concepts clearly and break down complex topics.
    Use examples, analogies, and step-by-step explanations. Encourage learning and ask questions to check understanding.`
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    // Regular HTTP request - return available personas
    if (req.method === 'GET') {
      return new Response(JSON.stringify({
        personas: Object.keys(personas).map(key => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          voice: personas[key].voice
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'WebSocket upgrade required for realtime voice' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Upgrade to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    let openaiSocket: WebSocket | null = null;
    let selectedPersona = 'default';
    let sessionCreated = false;
    
    clientSocket.onopen = () => {
      console.log('🔌 Client connected to edge function');
      
      // Connect to OpenAI Realtime API
      const openaiUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      
      openaiSocket = new WebSocket(openaiUrl, [
        'realtime',
        `openai-insecure-api-key.${OPENAI_API_KEY}`,
        'openai-beta.realtime-v1'
      ]);
      
      openaiSocket.onopen = () => {
        console.log('🔌 Connected to OpenAI Realtime API');
        clientSocket.send(JSON.stringify({ type: 'connected' }));
      };
      
      openaiSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 OpenAI event:', data.type);
          
          // When session is created, send session update with persona settings
          if (data.type === 'session.created' && !sessionCreated) {
            sessionCreated = true;
            const persona = personas[selectedPersona];
            
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: persona.instructions,
                voice: persona.voice,
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 800
                },
                temperature: 0.8,
                max_response_output_tokens: 'inf'
              }
            };
            
            console.log('📤 Sending session update with persona:', selectedPersona);
            openaiSocket!.send(JSON.stringify(sessionUpdate));
          }
          
          // Forward all messages to client
          clientSocket.send(event.data);
          
        } catch (error) {
          console.error('Error parsing OpenAI message:', error);
        }
      };
      
      openaiSocket.onerror = (error) => {
        console.error('❌ OpenAI WebSocket error:', error);
        clientSocket.send(JSON.stringify({ type: 'error', error: 'OpenAI connection error' }));
      };
      
      openaiSocket.onclose = (event) => {
        console.log('🔌 OpenAI connection closed:', event.code, event.reason);
        clientSocket.send(JSON.stringify({ type: 'disconnected', reason: event.reason }));
      };
    };
    
    clientSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 Client event:', data.type);
        
        // Handle persona change
        if (data.type === 'set_persona') {
          selectedPersona = data.persona || 'default';
          console.log('🎭 Persona set to:', selectedPersona);
          
          // If already connected, update session
          if (openaiSocket && sessionCreated) {
            const persona = personas[selectedPersona];
            const sessionUpdate = {
              type: 'session.update',
              session: {
                instructions: persona.instructions,
                voice: persona.voice
              }
            };
            openaiSocket.send(JSON.stringify(sessionUpdate));
          }
          return;
        }
        
        // Forward all other messages to OpenAI
        if (openaiSocket && openaiSocket.readyState === WebSocket.OPEN) {
          openaiSocket.send(event.data);
        } else {
          console.warn('OpenAI socket not ready, buffering message');
        }
        
      } catch (error) {
        console.error('Error handling client message:', error);
      }
    };
    
    clientSocket.onerror = (error) => {
      console.error('❌ Client WebSocket error:', error);
    };
    
    clientSocket.onclose = () => {
      console.log('🔌 Client disconnected');
      if (openaiSocket) {
        openaiSocket.close();
      }
    };
    
    return response;
    
  } catch (error) {
    console.error('WebSocket upgrade failed:', error);
    return new Response(JSON.stringify({ error: 'WebSocket upgrade failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
