---
name: Multicolored Accent Palette
description: Sistema de 5 cores rotativas (azul, roxo, verde, amarelo, vermelho) sobreposto ao tema dark, com helpers e componentes reutilizáveis para cards e subtítulos
type: design
---

Sobre o tema dark permanente (preto + prata), aplicamos uma paleta multicolorida (Variante A adaptada) para acentos visuais. Não migrar para fundo claro.

## Tokens (src/lib/colorThemes.ts)

5 temas — cada um com `card` (bg translúcido), `border` (vibrante /40, usar com `border-2`), `title` (`text-{cor}-300`), `hoverBg`, `hoverShadow`, `accent` (`text-{cor}-400`).

Cores Tailwind: blue, purple, emerald (green), amber (yellow), rose (red).

Helpers:
- `getColorTheme(index)` → rotação circular **blue → purple → green → yellow → red** para grids/listas.
- `getSectionTheme(section)` → cor fixa por rota: home/events/contact=blue, donations/discipleship=green, gallery/collaborators=purple, testimonials=yellow, bible=red.

## Componentes

- `<CardThemed colorTheme="blue">` (src/components/ui/themed-card.tsx) com subcomponentes `CardThemedHeader`, `CardThemedTitle`, `CardThemedContent`, `CardThemedFooter`. Wrapper opt-in — não substitui o `Card` shadcn neutro (usado em dialogs/forms).
- `<SectionHeading colorTheme="blue" as="h2" icon={<Icon/>}>` (src/components/ui/section-heading.tsx) para subtítulos coloridos de seção.

## Aplicação

Em grids/listas, `.map((item, idx) => <CardThemed colorTheme={getColorTheme(idx)} … />)`. Já aplicado em: Donations (BasketCard, CampaignCard), Testimonials, Gallery, Events. Headings principais dessas páginas usam `SectionHeading` com `getSectionTheme`.

Texto corrido continua neutro (`text-slate-300`/`text-slate-400`) para descanso visual.

## Tailwind safelist

Em tailwind.config.ts há safelist por regex para `(bg|border|text|ring|hover:bg|hover:shadow)-(blue|purple|emerald|amber|rose)-(200..600)(/\d+)?` — necessário porque as classes são compostas dinamicamente via objeto `COLOR_THEMES`.
