// Edge function: studio-transcribe
// Recebe áudio em base64 e devolve uma lista de legendas com timestamps.
// Usa Lovable AI Gateway (Gemini 2.5 Flash) com inline_data multimodal.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  audioBase64: string;       // base64 do áudio extraído (preferência: audio/webm ou audio/mpeg)
  mimeType?: string;         // ex: 'audio/webm'
  durationSeconds?: number;  // dica de duração total
  language?: string;         // ex 'pt-BR'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY ausente');

    const { audioBase64, mimeType = 'audio/webm', durationSeconds, language = 'pt-BR' }: RequestBody =
      await req.json();

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'audioBase64 é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sysPrompt = `Você é um transcritor profissional. Transcreva o áudio em ${language} e divida em legendas curtas (máximo 8 palavras cada). 
Use a função return_captions para devolver os blocos com start/end em segundos. 
${durationSeconds ? `A duração aproximada é ${durationSeconds.toFixed(1)}s.` : ''}`;

    const payload = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: sysPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Transcreva este áudio.' },
            // Lovable AI suporta inline data via image_url-like field para áudio também:
            { type: 'input_audio', input_audio: { data: audioBase64, format: mimeType.includes('mp3') ? 'mp3' : 'webm' } },
          ],
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'return_captions',
            description: 'Retorna blocos de legenda com timestamps.',
            parameters: {
              type: 'object',
              properties: {
                captions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'number' },
                      end: { type: 'number' },
                      text: { type: 'string' },
                    },
                    required: ['start', 'end', 'text'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['captions'],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'return_captions' } },
    };

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de requisições atingido.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error('transcribe gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'Falha na transcrição' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let captions: Array<{ start: number; end: number; text: string }> = [];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        captions = Array.isArray(args.captions) ? args.captions : [];
      } catch (e) {
        console.error('parse error', e);
      }
    }

    return new Response(JSON.stringify({ captions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('studio-transcribe error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
