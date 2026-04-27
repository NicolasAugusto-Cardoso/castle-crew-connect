## Objetivo

Aplicar uma paleta multicolorida (azul → roxo → verde → amarelo → vermelho) sobre o tema dark atual, **sem migrar para fundo claro**. O fundo do app continua preto (#0A0A0A). O que muda: cards, bordas e subtítulos passam a usar acentos coloridos rotativos. Variante A adaptada ao dark — cards com fundo translúcido pastel-escuro, borda fina vibrante e título colorido vibrante.

## Sistema de cores (adaptação dark da Variante A)

5 temas, cada um com 4 tokens Tailwind:

| Tema    | Card bg                | Borda                | Título                | Hover bg               |
|---------|------------------------|----------------------|-----------------------|------------------------|
| blue    | `bg-blue-500/10`       | `border-blue-400/40` | `text-blue-300`       | `hover:bg-blue-500/15` |
| purple  | `bg-purple-500/10`     | `border-purple-400/40` | `text-purple-300`   | `hover:bg-purple-500/15` |
| green   | `bg-emerald-500/10`    | `border-emerald-400/40` | `text-emerald-300` | `hover:bg-emerald-500/15` |
| yellow  | `bg-amber-500/10`      | `border-amber-400/40`  | `text-amber-300`    | `hover:bg-amber-500/15` |
| red     | `bg-rose-500/10`       | `border-rose-400/40`   | `text-rose-300`     | `hover:bg-rose-500/15` |

Comum a todos os cards: `border-2 rounded-2xl transition-all duration-300 hover:shadow-lg`. Texto corrido fica neutro (`text-slate-300`/`text-muted-foreground`).

Sequência circular padrão: **blue → purple → green → yellow → red** (helper `getColorTheme(index)`).

## Implementação técnica

### 1. Novo arquivo `src/lib/colorThemes.ts`
- Exporta tipo `ColorTheme = 'blue' | 'purple' | 'green' | 'yellow' | 'red'`.
- Exporta `COLOR_THEMES: Record<ColorTheme, { card, border, title, hoverBg, shadow, ring }>` com as classes Tailwind acima.
- Exporta `getColorTheme(index: number): ColorTheme` que faz `THEMES[index % 5]`.
- Exporta `getSectionTheme(route: string): ColorTheme` mapeando rotas → cor fixa para subtítulos de seção (Eventos=blue, Doações=green, Galeria=purple, Testemunhos=yellow, Bíblia=red, Contato=blue, Discipulado=green, Colaboradores=purple, Home=blue).

### 2. Novo wrapper `src/components/ui/themed-card.tsx`
- `<CardThemed colorTheme="blue" className="…">` que estende o `Card` shadcn aplicando as classes do tema (bg, border-2, hover) + repassa children.
- Subcomponentes `CardThemedHeader`, `CardThemedTitle` (recebe colorTheme e aplica `text-{cor}-300 font-semibold`) e reexporta `CardContent`/`CardFooter`.
- Mantém compatibilidade: aceita todas as props do `Card` original.

### 3. Novo `src/components/ui/section-heading.tsx`
- `<SectionHeading colorTheme="blue" as="h2">Título</SectionHeading>`
- Renderiza heading com `text-{cor}-300 font-bold tracking-tight` + tamanho responsivo conforme nível.
- Usado para subtítulos de seções dentro das páginas.

### 4. Aplicação nos grids/listas (rotação circular)
Refatorar para usar `CardThemed` + `getColorTheme(index)`:
- `src/components/donations/BasketCard.tsx` → recebe `index` como prop, aplica tema.
- `src/components/donations/CampaignCard.tsx` → idem.
- `src/components/events/*` (cards de evento na lista de Eventos).
- `src/components/gallery/*` (cards de pasta da Galeria).
- `src/components/testimonials/*` (cards de testemunho).
- `src/components/posts/*` (cards de post na Home).
- Em cada página consumidora (`Donations.tsx`, `Events.tsx`, `Gallery.tsx`, `Testimonials.tsx`, `Home.tsx`, `Discipleship.tsx`, `Collaborators.tsx`, `Bible.tsx`), passar `index` no `.map()`.

### 5. Subtítulos por seção (cor fixa)
Substituir `<h2>`/`<h3>` de seção em cada página por `<SectionHeading colorTheme={…}>`, usando a cor fixa da seção definida em `getSectionTheme`.

### 6. Cards genéricos do shadcn
**Não** modificar `src/components/ui/card.tsx` (afeta dialogs, popovers e dezenas de usos internos). O `CardThemed` é um wrapper opt-in. Cards de UI puramente funcionais (forms, dialogs) continuam usando o `Card` neutro.

### 7. Safelist Tailwind
Como as classes coloridas são montadas dinamicamente, adicionar `safelist` em `tailwind.config.ts` para garantir que JIT não remova:
```
safelist: [
  { pattern: /(bg|border|text|hover:bg|hover:shadow)-(blue|purple|emerald|amber|rose)-(100|200|300|400|500)(\/\d+)?/ },
]
```

## Páginas afetadas (resumo)

- **Home** — subtítulos por seção + posts em rotação.
- **Eventos** — heading azul, cards rotativos.
- **Doações** — heading verde, BasketCard/CampaignCard rotativos.
- **Galeria** — heading roxo, pastas rotativas.
- **Testemunhos** — heading amarelo, cards rotativos.
- **Bíblia** — heading vermelho, cards de leitura.
- **Discipulado / Colaboradores / Contato** — headings na cor da seção, listas rotativas.

## O que NÃO muda

- Splash, Login, fundo geral preto, paleta prata/branco do tema base, botões `btn-premium`/`btn-clean`, navegação, tipografia base.
- `src/index.css` (tokens HSL), `src/components/ui/card.tsx`, demais primitives shadcn.
- Lógica de negócio, queries, RLS, rotas.

## Critério de aceite

- Em cada grid/lista, os cards alternam circularmente entre as 5 cores começando por azul.
- Subtítulos de seção usam a cor fixa definida e legíveis sobre fundo preto (tons -300, contraste OK).
- Hover suave (`duration-300`) com leve aumento de opacidade do fundo + sombra colorida discreta.
- Nenhuma regressão visual em dialogs, forms, chat e splash.
