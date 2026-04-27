---
name: Multicolored Accent Palette
description: Sistema de 5 cores (azul, roxo, verde, amarelo, vermelho) em estilo neon-outline sobre tema dark — fundo preto sólido, borda fina vibrante, valor/ícone colorido, glow no hover
type: design
---

Estilo "neon outline" sobre o tema dark permanente: fundo preto sólido, borda fina vibrante colorida, título branco, valor/número grande na cor do tema, ícone na cor do tema, glow colorido sutil no hover. Inspirado em painel de stats moderno (cards "BMs/Contas/Páginas/URLs").

## Tokens (src/lib/colorThemes.ts)

5 temas (`blue`, `purple`, `green`, `yellow`, `red`) — cada um com:
- `card: "bg-[#0A0A0A]"` (sólido)
- `border: "border-{cor}-500/70"` (1px)
- `title: "text-foreground"` (branco — só accents são coloridos)
- `accent: "text-{cor}-400"` (ícones, números, autor de testemunho)
- `hoverBorder: "hover:border-{cor}-400"`
- `hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(...)]"` (glow)
- `ring`, `glowColor`

Cores Tailwind: blue, purple, emerald (green), amber (yellow), rose (red).

Helpers:
- `getColorTheme(idx)` — rotação circular blue → purple → green → yellow → red.
- `getSectionTheme(rota)` — cor fixa por rota (home/events/contact=blue, donations/discipleship=green, gallery/collaborators=purple, testimonials=yellow, bible=red).
- `getNeonVariant(theme)` — mapeia para variante de Button (neonBlue/neonPurple/...).

## Componentes (src/components/ui/themed-card.tsx)

- `<CardThemed colorTheme>` — wrapper opt-in. NÃO substitui `Card` shadcn (usado em dialogs/forms permanece neutro).
- `CardThemedHeader`, `CardThemedContent`, `CardThemedFooter` (footer já estilizado em `text-xs text-slate-500`).
- `CardThemedTitle` — branco por padrão; `colored` prop pinta na cor do tema.
- `CardThemedAccent` — bloco grande `text-3xl font-bold` na cor do tema, para preço/contador/destaque.

## Botões (src/components/ui/button.tsx)

5 variantes neon: `neonBlue`, `neonPurple`, `neonGreen`, `neonYellow`, `neonRed`. Borda colorida + texto colorido + hover com glow. Use via `variant={getNeonVariant(theme)}` em CTAs dentro de cards.

## Section headings (src/components/ui/section-heading.tsx)

`<SectionHeading colorTheme as icon>` para subtítulos coloridos de seção (`text-{cor}-300`). Hierarquia: subtítulos de seção = coloridos; títulos dentro de cards = brancos com acento colorido.

## Aplicado em

Donations (BasketCard, CampaignCard com Accent + botão neon), Testimonials, Gallery, Events. Headings principais usam `SectionHeading`.

## Tailwind safelist

Em tailwind.config.ts: regex cobre `(bg|border|text|ring|hover:bg|hover:shadow)-(blue|purple|emerald|amber|rose)-(200..600)(/\d+)?`. Os `hover:shadow-[…]` literais funcionam sem safelist.
