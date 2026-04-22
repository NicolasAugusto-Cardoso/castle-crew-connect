// Edge function: studio-ai-assistant
// Recebe a mensagem do usuário + um snapshot do projeto e devolve:
//  - reply: texto curto em pt-BR para o chat
//  - actions: lista de operações estruturadas (cut_silence, generate_captions, trim, set_speed, add_caption)
// Usa Lovable AI Gateway com tool-calling.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  projectSnapshot?: {
    duration?: number;
    clipsCount?: number;
    captionsCount?: number;
    currentTime?: number;
  };
}

const SYSTEM_PROMPT = `Você é Cutty AI, assistente de edição de vídeo embutido em um editor estilo CapCut.
Responda SEMPRE em português brasileiro, de forma concisa e amigável.
Quando o usuário pedir uma ação no vídeo, chame a função "apply_video_actions" com a lista de operações.
Operações disponíveis:
- remove_silence: remove silêncios automaticamente (parâmetro opcional: threshold_db, min_duration_s)
- generate_captions: gera legendas automáticas a partir do áudio
- set_speed: altera velocidade (parâmetro: factor — ex 0.5, 1.5, 2)
- trim: recorta um intervalo (parâmetros: start, end em segundos)
- add_caption: adiciona uma legenda (parâmetros: text, start, end)
- darker / brighter / cooler / warmer: ajustes visuais (sem parâmetros)
Se o usuário só conversar, responda normalmente sem chamar a função.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, projectSnapshot }: RequestBody = await req.json();

    const contextLine = projectSnapshot
      ? `Contexto do projeto: duração=${projectSnapshot.duration?.toFixed(1) ?? '?'}s, clipes=${projectSnapshot.clipsCount ?? 0}, legendas=${projectSnapshot.captionsCount ?? 0}, playhead=${projectSnapshot.currentTime?.toFixed(1) ?? 0}s.`
      : '';

    const payload = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n${contextLine}` },
        ...messages,
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'apply_video_actions',
            description: 'Aplica uma sequência de ações no projeto de vídeo aberto.',
            parameters: {
              type: 'object',
              properties: {
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: [
                          'remove_silence',
                          'generate_captions',
                          'set_speed',
                          'trim',
                          'add_caption',
                          'darker',
                          'brighter',
                          'cooler',
                          'warmer',
                        ],
                      },
                      threshold_db: { type: 'number' },
                      min_duration_s: { type: 'number' },
                      factor: { type: 'number' },
                      start: { type: 'number' },
                      end: { type: 'number' },
                      text: { type: 'string' },
                    },
                    required: ['type'],
                    additionalProperties: false,
                  },
                },
                reply: {
                  type: 'string',
                  description: 'Mensagem curta em pt-BR para mostrar no chat.',
                },
              },
              required: ['actions', 'reply'],
              additionalProperties: false,
            },
          },
        },
      ],
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
      return new Response(JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no workspace.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Gateway error', resp.status, errText);
      return new Response(JSON.stringify({ error: 'Falha ao consultar IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    let reply = choice?.message?.content || '';
    let actions: Array<Record<string, unknown>> = [];

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        reply = args.reply || reply || 'Feito!';
        actions = Array.isArray(args.actions) ? args.actions : [];
      } catch (e) {
        console.error('Falha ao parsear tool args', e);
      }
    }

    if (!reply) reply = 'Pronto.';

    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('studio-ai-assistant error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
