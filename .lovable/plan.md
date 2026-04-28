## Objetivo

Refinar o design system neon: brilho mais sutil (nível 4/10), corrigir tabs sobrepostas em Eventos/Bíblia/Colaboradores, padronizar uma cor por aba e aplicar o sistema visual à página Contato.

## 1. Reduzir intensidade do glow (nível 4/10)

Substituir todos os `shadow-[…]` neon por valores mais suaves, reduzindo blur, spread e opacidade.

**Padrão antigo → novo:**
- Card border idle: `shadow-[0_0_18px_-10px_hsl(...)]` → `shadow-[0_0_10px_-8px_hsl(.../0.35)]`
- Card hover: `shadow-[0_0_24px_-4px_hsl(.../0.55)]` → `shadow-[0_0_14px_-6px_hsl(.../0.30)]`
- Botões neon (default + neonX): `shadow-[0_0_18px_-8px_hsl(...)]` / hover `0_0_22px_-5px_.../0.75` → idle removido, hover `0_0_12px_-6px_.../0.35`
- Tabs ativos: `shadow-[0_0_16px_-6px_.../0.75]` → `shadow-[0_0_10px_-6px_.../0.35]`
- Mobile nav active icon `drop-shadow-[0_0_8px_currentColor]` → `drop-shadow-[0_0_4px_currentColor]` + `opacity 0.6` via inline
- Underline mobile nav `shadow-[0_0_8px_currentColor]` → `shadow-[0_0_4px_currentColor]`
- Reduzir bordas de `/70` → `/55` para suavizar contorno

Arquivos:
- `src/lib/colorThemes.ts` (tokens `border`, `hoverShadow`)
- `src/components/ui/button.tsx` (todas variantes neon + default/outline/secondary/ghost)
- `src/components/ui/tabs.tsx` (TabsList + TabsTrigger active state)
- `src/components/ui/card.tsx` (shadow base)
- `src/components/Layout.tsx` (sidebar + bottom nav glows)

## 2. Sistema de cor contextual por aba (CSS variables)

Criar contexto: cada rota injeta `--page-primary` e `--page-glow` no container raiz da página. Componentes lêem essas variáveis em vez de cor fixa.

**Implementação:**
- Adicionar mapa rota→cor em `src/lib/colorThemes.ts` (já existe `getSectionTheme`).
- Em `src/components/Layout.tsx`, calcular tema da rota atual via `getSectionTheme(location.pathname)` e aplicar `style={{ '--page-primary': '<hsl>', '--page-glow': '<hsl>/0.35' }}` no `<main>`.
- Atualizar `tabs.tsx`, `button.tsx` (variant `default`), `card.tsx` (default) e ícone ativo da bottom nav para usar `hsl(var(--page-primary))` em vez de `--neon-blue` hardcoded.
- Sidebar/bottom nav continuam com cores rotativas por item (uso intencional para distinguir abas), mas o ícone ativo usa `--page-primary` para reforçar consistência.

Mapa final (já parcialmente em `SECTION_THEME_MAP`):
- home/events/contact → blue
- donations/discipleship → green
- gallery/collaborators → purple
- testimonials → yellow
- bible → red

## 3. Corrigir sobreposição de Tabs

**Eventos** (`src/pages/Events.tsx` L193): `TabsList className="grid w-full grid-cols-2"` força largura cheia mas trigger shadow ativa estouraba. Adicionar `gap-2`, `isolate` no TabsList e `relative` no trigger. Remover qualquer `-ml`/`-mr`.

**Bíblia** (`src/components/bible/BibleSavedSection.tsx` L114): `TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-none"` está sem padding interno e sem gap; o estilo neon novo conflita com `rounded-none` + `bg-muted/50`. Remover overrides legados, usar default da `TabsList` com `w-full grid grid-cols-2 gap-2`.

**Colaboradores** (`src/pages/Collaborators.tsx` L159): `TabsList` sem largura no flex container está colidindo com `<Select>` ao lado. Adicionar `shrink-0` no TabsList e `flex-wrap` no container pai L158.

Em `src/components/ui/tabs.tsx`:
- TabsList: adicionar `isolate gap-1`
- TabsTrigger: adicionar `relative` + `z-0`, ativo `z-10`
- Remover `overflow-hidden` (recorta o glow e cria conflito visual com hovers adjacentes)

## 4. Estilizar página Contato

`src/pages/Contact.tsx` e componentes em `src/components/contact/` estão usando estilos crus. Aplicar:
- Wrappers de seções → `CardThemed colorTheme="blue"` (cor da seção contact)
- Botões CTA → `variant="neonBlue"` (ou `getNeonVariant`)
- Inputs (incluindo `ChatInput`) → adicionar borda neon-blue/40 + focus neon-blue, mantendo arredondamento `rounded-xl`
- Subtítulos → `<SectionHeading colorTheme="blue">`
- Lista de conversas → cards com border `border-neon-blue/40` e hover suave

Arquivos a editar:
- `src/pages/Contact.tsx`
- `src/components/contact/MessageThread.tsx`
- `src/components/chat/ChatHeader.tsx`, `ChatInput.tsx`
- `src/components/ui/input.tsx` (opcional: usar `--page-primary` no focus ring)

## 5. Validação

- Verificar visualmente as 4 rotas: /events, /bible, /colaboradores, /contact
- Confirmar que cada página tem 1 cor dominante consistente
- Confirmar que tabs não se sobrepõem
- Confirmar que glow está discreto

## Detalhes técnicos

- Sem mudança de lógica de negócio
- Sem alteração de estrutura de rotas/dados
- Apenas Tailwind/CSS
- Mantido mobile-first (todos breakpoints `sm:` e abaixo)
- CSS variables aplicadas no `<main>` em Layout.tsx para herança automática