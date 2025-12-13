import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log('🔊 Fetching available voices...');

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ ElevenLabs API error:', errorData);
      throw new Error(errorData.detail?.message || 'Failed to fetch voices');
    }

    const data = await response.json();
    console.log(`✅ Found ${data.voices?.length || 0} voices`);

    // Map to simplified voice objects
    const voices = data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'premade',
      description: voice.description || '',
      previewUrl: voice.preview_url,
      labels: voice.labels || {},
    }));

    return new Response(
      JSON.stringify({ voices }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in elevenlabs-voices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
