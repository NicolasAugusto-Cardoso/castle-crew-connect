

# Editor de Foto e Vídeo — Social Media

Vou criar dois editores integrados ao fluxo de tarefas do social media, acessíveis a partir da tela de detalhes de uma tarefa (botões "Editar Foto" / "Editar Vídeo") e também via menu lateral ("Estúdio").

## Escopo (alinhado com escolhas anteriores)

- **Acesso**: roles `admin` e `social_media` (volunteer não acessa o estúdio)
- **Vídeo**: MVP visual + export simples (MediaRecorder)
- **Legendas**: Lovable AI / Gemini (sem ElevenLabs por agora)
- **Foto**: presets + sliders client-side via Canvas
- **Persistência**: projetos salvos no banco; mídias no Storage

## 1. Banco de dados (uma migration)

**Tabela `media_projects`**
```text
id uuid PK | user_id uuid | task_id uuid? FK social_media_tasks
type text ('video' | 'photo')
title text | thumbnail_url text?
source_url text         -- arquivo original
output_url text?        -- arquivo final exportado
project_data jsonb      -- timeline / clips / filtros / legendas
created_at | updated_at
```

**RLS**: dono vê/edita tudo seu; admin vê tudo. Trigger `update_updated_at_column`.

**Bucket `media-projects`** (público, 200 MB) — pastas `{user_id}/sources/` e `{user_id}/exports/`.

## 2. Estrutura de rotas e arquivos

```text
/studio                       → StudioHome (lista "Meus Projetos" + Novo)
/studio/photo/:projectId?     → PhotoEditor
/studio/video/:projectId?     → VideoEditor
```

```text
src/pages/
  Studio.tsx                  -- hub: cards "Novo Vídeo" / "Nova Foto" + grid de projetos
  PhotoEditor.tsx
  VideoEditor.tsx

src/components/studio/
  ProjectCard.tsx
  UploadDropzone.tsx          -- drag & drop reutilizável

  photo/
    FilterPresets.tsx         -- Lightroom-like (Vivid, Mono, Warm, Cool, Film, Fade...)
    AdjustmentSliders.tsx     -- brilho, contraste, saturação, exposição, temp, vinheta
    PhotoCanvas.tsx           -- <canvas> com filtros CSS aplicados ao 2D context

  video/
    VideoPreview.tsx          -- <video> + overlay de legendas
    Timeline.tsx              -- multi-track (vídeo + legendas), zoom, playhead
    TrackClip.tsx             -- bloco arrastável/cortável
    AIChatSidebar.tsx         -- chat à esquerda (estilo Lovable)
    PropertiesPanel.tsx       -- direita: fontes, cores, posição, escala, áudio
    SilenceCutPanel.tsx       -- threshold + min duração + preview de cortes
    CaptionsPanel.tsx         -- gerar via Gemini, lista editável

src/hooks/
  useMediaProjects.ts         -- CRUD via React Query
  useStickyState.ts           -- persistência local (localStorage)
  useSilenceDetection.ts      -- Web Worker + AudioContext
  useVideoExport.ts           -- MediaRecorder + canvas overlay

src/workers/
  silenceWorker.ts            -- analisa AudioBuffer, retorna cortes

supabase/functions/
  transcribe-audio/index.ts   -- recebe áudio base64, chama Lovable AI Gemini, retorna SRT
```

## 3. Editor de Foto

Layout em 3 colunas (responsivo: stack no mobile):

```text
┌──────────────┬──────────────────────────┬──────────────┐
│  Presets     │   Preview <canvas>       │  Sliders     │
│  (rolável)   │   (zoom / fit)           │  Brilho      │
│  Vivid       │                          │  Contraste   │
│  Mono ✓      │                          │  Saturação   │
│  Warm        │                          │  Exposição   │
│  ...         │                          │  Temperatura │
│              │                          │  Vinheta     │
└──────────────┴──────────────────────────┴──────────────┘
        [Reset] [Comparar antes/depois] [Salvar] [Exportar PNG]
```

- Filtros via `ctx.filter = "brightness(...) contrast(...) saturate(...) hue-rotate(...)"`
- 8 presets pré-definidos como combinações de slider
- Export: `canvas.toBlob` → upload para Storage → atualiza `output_url`
- Estado salvo em `project_data.adjustments` para reabertura

## 4. Editor de Vídeo (MVP)

Layout 4 quadrantes inspirado em CapCut (desktop). No mobile vira tabs (Chat / Preview / Props) + timeline fixa em baixo.

```text
┌──────────┬───────────────────────┬──────────┐
│  Chat IA │     Video Preview     │  Props   │
│          │     (com legendas)    │          │
│  Você:   │                       │  Texto   │
│  cortar  │                       │  Fonte   │
│  silêncio│                       │  Cor     │
│          │                       │  Posição │
│  AI:     │                       │  Escala  │
│  feito ✓ │                       │  Áudio   │
├──────────┴───────────────────────┴──────────┤
│  Timeline  ▶ ▮▮ │00:00 ─────────── 02:34│   │
│  V1 [====clip1====][==clip2==]              │
│  T1     [legenda]   [legenda]   [legenda]   │
└─────────────────────────────────────────────┘
```

**Chat IA (sidebar esquerda)**
- Lista de mensagens com markdown (`react-markdown` já é padrão do projeto)
- Comandos reconhecidos: "remover silêncio", "gerar legendas", "remover ruído", "cortar de X a Y"
- Edge function `studio-ai-assistant` (Lovable AI Gemini) interpreta texto livre em ações estruturadas (tool-calling) e devolve um patch a aplicar no `project_data`

**Timeline**
- Track de vídeo (V1) com clips representando segmentos não-cortados
- Track de legendas (T1) com blocos de texto
- Drag para reordenar, handles laterais para trim, click para selecionar
- Playhead sincronizado com `<video>.currentTime`

**Corte de silêncio (Web Worker)**
- Decodifica áudio com `AudioContext.decodeAudioData`
- Worker percorre samples, calcula RMS em janelas de 50 ms
- Marca silêncios com RMS < threshold (default -40 dB) por > 0.8 s
- Gera lista de clips "ativos" → renderiza na timeline

**Legendas automáticas**
- Botão "Gerar legendas" → extrai áudio (WebAudio → wav blob) → envia para edge function `transcribe-audio`
- Edge function chama Lovable AI Gemini 2.5 Flash com áudio (multimodal) pedindo JSON `[{start, end, text}]`
- Resultado vira blocos editáveis na track T1; clique abre painel direito com fonte/cor/posição

**Remover ruído (preset rápido)**
- Aplica `BiquadFilter` (highpass 80 Hz + lowpass 12 kHz + leve ganho) no grafo de áudio durante export

**Export simples (MediaRecorder)**
- Compõe `<canvas>` que desenha o vídeo + legendas overlay frame a frame
- `canvas.captureStream(30)` + `MediaRecorder` em webm/mp4
- Pula segmentos silenciosos durante a gravação
- Sobe para Storage → grava `output_url` → toast "Pronto!" com link de download

## 5. Integração com Tarefas

- `TaskDetailDialog` ganha dois botões para `social_media`/`admin`:
  - **Editar Foto** → `/studio/photo?taskId={id}` (cria projeto vinculado)
  - **Editar Vídeo** → `/studio/video?taskId={id}`
- Tela de detalhes da tarefa lista projetos vinculados (`media_projects.task_id = task.id`) com thumbnail e status
- Ao exportar, oferece "Anexar à tarefa" (adiciona em `reference_urls`) e "Marcar como concluída"

## 6. Menu lateral

Adicionar item ao `Layout.tsx`:
```text
{ icon: Clapperboard, label: 'Estúdio', path: '/studio',
  roles: ['admin', 'social_media'] }
```

## 7. Persistência e performance

- `useStickyState` (localStorage) para preservar timeline/ajustes ao trocar de aba antes de salvar
- Auto-save a cada 5 s (debounced) gravando `project_data` no banco
- Web Worker isola análise de áudio da UI thread
- Lazy-load das rotas `/studio/*` via `React.lazy` (bundle ffmpeg-free leve)

## 8. Detalhes técnicos

- `lucide-react` para ícones (Clapperboard, Image, Wand2, Scissors, Captions, Volume2, Type, Download)
- `shadcn/ui`: Dialog, Slider, Tabs, ScrollArea, ResizablePanelGroup (já instalado), Tooltip
- React Query para CRUD de projetos com dual-invalidation
- Tipos compartilhados em `src/types/studio.ts` (`Clip`, `Caption`, `Adjustments`, `ProjectData`)
- Tema dark opcional dentro do `/studio` via classe wrapper `.studio-dark` (não toca no tema global)

## Entrega faseada (nesta mensagem)

Para caber em uma resposta sem estourar limites, vou implementar nesta ordem:

1. Migration (tabela + bucket + RLS)
2. `Studio.tsx` (hub + criação de projetos) e rota
3. `PhotoEditor.tsx` completo (presets + sliders + export)
4. `VideoEditor.tsx` com layout 4 quadrantes, preview, timeline básica e export MediaRecorder
5. Edge function `transcribe-audio` + painel de legendas
6. Web Worker de silêncio + painel de cortes
7. Integração com `TaskDetailDialog` e item de menu

Se o contexto apertar, paro depois do passo 4 e sigo no próximo turno com 5–7.

