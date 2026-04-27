## Objetivo

Mudar o estilo da paleta multicolorida de "pastel translúcido" para o **neon-outline** da referência: cards com **fundo preto sólido**, **borda fina vibrante colorida**, **título branco**, **valor/número grande na cor do tema**, **ícone na cor do tema** e **glow colorido sutil no hover**. Botões ganham uma variante combinando.

## O que muda visualmente

Antes: card com `bg-blue-500/10` + `border-2 border-blue-400/40` + título `text-blue-300`.
Depois: card com `bg-[#0A0A0A]` + `border border-blue-500/70` + título branco + número/ícone `text-blue-400` + `hover:shadow-[0_0_24px_-4px_rgba(...)]`.

## Implementação

### 1. `src/lib/colorThemes.ts` — refatorar tokens
Substituir os tokens da Variante A por neon-outline. Cada `ColorTheme` passa a ter:
- `card: "bg-[#0A0A0A]"` (sólido, igual ao app)
- `border: "border-{cor}-500/70"` (1px vibrante)
- `title: "text-foreground"` (branco — só `accent` é colorido)
- `accent: "text-{cor}-400"` (ícones + valores grandes)
- `hoverBorder: "hover:border-{cor}-400"`
- `hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(...)]"` (glow colorido)
- `ring: "focus-visible:ring-{cor}-400"`

Helpers `getColorTheme` / `getSectionTheme` continuam iguais. Rotação circular blue → purple → green → yellow → red preservada.

### 2. `src/components/ui/themed-card.tsx` — ajustar wrapper
- `CardThemed`: trocar `border-2 rounded-2xl` por `border rounded-2xl` (1px), aplicar `card + border + hoverBorder + hoverShadow`. Padding interno reduzido para `p-5` (mais compacto, igual à referência).
- `CardThemedTitle`: por padrão **branco** (`text-foreground`). Nova prop `colored` para casos onde o título deve receber a cor do tema.
- **Novo** `CardThemedAccent`: bloco grande em `text-3xl font-bold {accent}` para o número/valor de destaque (ex: "R$ 50,00", "0", contadores).
- `CardThemedFooter`: estilizado com `text-xs text-slate-500` (linha "Atualizado" sutil).

### 3. `src/components/ui/button.tsx` — nova variante `neon`
Adicionar variante que combine com os cards:
```ts
neon: "bg-transparent border border-blue-500/70 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 hover:shadow-[0_0_16px_-4px_rgba(59,130,246,0.5)] transition-all"
```
Como Tailwind `cva` não aceita cor dinâmica, criar **5 variantes**: `neonBlue`, `neonPurple`, `neonGreen`, `neonYellow`, `neonRed`. Usadas em CTAs dentro de cards coloridos.

Adicionar também helper `getNeonVariant(theme: ColorTheme)` em `colorThemes.ts` que retorna o nome da variante correspondente.

### 4. Atualizar consumidores
- **BasketCard**: título branco; preço `R$ XX,XX` migra para `<CardThemedAccent>` colorido; botão "Selecionar" usa `variant={getNeonVariant(theme)}`.
- **CampaignCard**: título branco; metas (valores) usam cor do tema; ícone `<Target>` na cor do tema.
- **Testemunhos**: título do testemunho branco; nome do autor na cor do tema (já é, mantém).
- **Galeria**: título da pasta branco; ícone Folder colorido; data colorida.
- **Eventos**: título do evento branco; ícones (Clock, MapPin, Users) na cor do tema.

### 5. SectionHeading
Mantém comportamento atual (subtítulos coloridos `text-{cor}-300`) — não muda. A diferenciação fica clara: **subtítulos de seção** = coloridos; **títulos dentro de cards** = brancos com acento colorido.

### 6. Safelist Tailwind
Já cobre as classes necessárias (`border-{cor}-500/70`, `hover:border-{cor}-400`, `text-{cor}-400`). O `hover:shadow-[…]` é literal arbitrary value e funciona sem safelist.

### 7. Atualizar memória
Atualizar `mem://design/multicolored-accent-palette` para refletir o novo estilo neon-outline (substitui a descrição "pastel translúcido").

## Arquivos editados

- `src/lib/colorThemes.ts` (tokens + helper `getNeonVariant`)
- `src/components/ui/themed-card.tsx` (padding, novo `CardThemedAccent`, título branco por padrão)
- `src/components/ui/button.tsx` (5 variantes neon)
- `src/components/donations/BasketCard.tsx`
- `src/components/donations/CampaignCard.tsx`
- `src/pages/Testimonials.tsx`
- `src/pages/Gallery.tsx`
- `src/pages/Events.tsx`
- `.lovable/memory/design/multicolored-accent-palette.md`

## Critério de aceite

- Cards com fundo preto sólido (sem fill colorido), borda fina vibrante, igual à referência.
- Valores numéricos (preço, metas, contadores) e ícones em cor do tema; títulos brancos.
- Hover gera glow colorido sutil.
- Botões CTA dentro de cards coloridos seguem o mesmo padrão neon-outline.
- Subtítulos de seção (SectionHeading) continuam coloridos para hierarquia visual.
