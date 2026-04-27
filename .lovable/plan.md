## Refatoração para Dark Mode Premium (Preto + Prata)

Vou transformar todo o app de tema azul/amarelo claro para um Dark Mode premium e minimalista (preto + prata + branco), atualizando o design system global. Como tudo no app usa tokens semânticos (`bg-background`, `text-foreground`, `border-border`, etc.), redefinir os tokens em `index.css` propaga as mudanças para todas as páginas automaticamente, sem precisar editar cada arquivo individualmente.

### 1. `src/index.css` — Novo Design System (centro da refatoração)

**Tokens HSL atualizados em `:root`:**
- `--background: 0 0% 4%` (preto base #0A0A0A)
- `--card / --popover: 0 0% 7%` (superfície elevada #121212)
- `--foreground: 0 0% 96%` (texto principal prata-branco)
- `--muted-foreground: 0 0% 64%` (texto secundário prata #A3A3A3)
- `--primary: 0 0% 92%` (prata clara, usado para destaque clean)
- `--primary-foreground: 0 0% 7%` (texto escuro sobre prata para contraste perfeito)
- `--accent: 0 0% 80%` (prata para detalhes)
- `--secondary / --muted: 0 0% 10%` (superfície sutil)
- `--border / --input: 0 0% 100% / 0.08` em formato HSL alpha → uso de `0 0% 100%` com `border-opacity` + `--ring: 0 0% 75%` (anel de foco prata visível)
- `--destructive: 0 65% 55%` (vermelho ajustado para fundo escuro)

**Gradientes:**
- `--gradient-primary: linear-gradient(135deg, hsl(0 0% 95%), hsl(0 0% 75%))` (prata/branco para Variante B)
- `--gradient-hero: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)` (sutil, sem cor)
- Remover `--gradient-accent` amarelo

**Sombras:**
- `--shadow-card`: substituída por `inset 0 0 0 1px rgba(255,255,255,0.06)` (borda fina em vez de sombra)
- `--shadow-glow: 0 0 24px hsl(0 0% 100% / 0.06)` (glow prata muito sutil)
- Remover `--shadow-accent`

**Body background:** trocar o gradiente azul atual por `hsl(var(--background))` puro.

**`.dark`:** manter os mesmos valores (o app fica permanentemente escuro).

### 2. Componentes utilitários no `@layer components`

**Variante A (Clean) — `.btn-clean`:**
```css
background: hsl(var(--background));
border: 1px solid rgba(255,255,255,0.12);
color: hsl(var(--foreground));
/* hover: border rgba(255,255,255,0.24) + bg rgba(255,255,255,0.03) */
```

**Variante B (Destaque) — `.btn-premium` (substitui `.btn-gradient`/`.btn-accent`):**
```css
background: var(--gradient-primary); /* prata→branco */
color: #121212; /* texto escuro, contraste AAA */
font-weight: 600;
/* hover: subtle scale + glow prata */
```

**`.card-elevated`:** trocar `box-shadow` por `border: 1px solid rgba(255,255,255,0.08)` + `background: hsl(var(--card))`. Hover usa borda mais brilhante em vez de translação pesada.

**`.gradient-text`:** atualizar para usar `--gradient-primary` (prata/branco).

### 3. `src/components/ui/input.tsx` — Inputs visíveis no escuro

Atualizar a className padrão:
```
bg-white/[0.04] border border-white/10
focus-visible:ring-2 focus-visible:ring-[hsl(0,0%,75%)] focus-visible:ring-offset-0
focus-visible:border-white/20
placeholder:text-muted-foreground/60
```

Garante o "anel prata visível" exigido nos critérios.

### 4. `src/components/ui/button.tsx` — novas variantes

Adicionar duas variantes ao `cva`:
- `clean`: `bg-background border border-white/10 text-foreground hover:bg-white/5 hover:border-white/20`
- `premium`: `bg-gradient-to-r from-[hsl(0,0%,95%)] to-[hsl(0,0%,80%)] text-[#121212] font-semibold hover:opacity-95`

Manter as variantes existentes (`default`, `outline`, etc.) — elas vão herdar os novos tokens automaticamente.

### 5. `src/pages/Login.tsx` — ajustes pontuais

- Container: trocar `bg-gradient-to-br from-background via-background to-primary/5` por `bg-background` (fundo preto puro).
- Logo no círculo: trocar `ring-primary` por `ring-white/15` e `bg-white` por `bg-white` (mantém contraste do logo escuro). Adicionar `shadow-[0_0_30px_rgba(255,255,255,0.04)]` (glow prata sutil).
- Título: `gradient-text` automaticamente vira prata/branco.
- Botão "Entrar": `btn-gradient` → `btn-premium` (gradiente prata, texto escuro).
- Botão "Criar Conta": `btn-accent` → `variant="clean"` ou `btn-clean` (preto + borda prata + texto branco).
- `CardDescription` e o texto de regras de senha: garantir `text-muted-foreground` (vira o cinza prata #A3A3A3 automaticamente).
- Comentários `// REFATOR: ...` indicando cada ajuste.

### 6. `src/pages/Home.tsx` — ajustes pontuais

- "Versículo do Dia": trocar `bg-gradient-to-br from-primary-light to-primary text-white` por `bg-card border border-white/10 text-foreground`. Ícone `BookOpen` e referência: trocar `text-accent` por `text-foreground/90`. Mantém hierarquia mas em monocromático.
- Avatares, posts, botões de like/reaction herdam tokens novos sem mudança.

### 7. `src/components/Layout.tsx` — header e bottom nav

- Header: trocar `bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]` por `bg-background border-b border-white/8`.
- Bottom nav mobile: trocar gradiente azul `from-[#33C2FF] to-[#2367FF]` por `bg-card border-t border-white/8`. Itens ativos: `text-foreground` + glow prata sutil; inativos: `text-muted-foreground`.
- Sidebar desktop: já usa `bg-card border-r border-border` — vira escura automaticamente.
- Item ativo na sidebar: trocar `bg-primary text-primary-foreground` por `bg-white/[0.06] text-foreground border border-white/10` (mais elegante que prata sólido).

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/index.css` | Reescrever `:root`, `.dark`, body, `@layer components` com paleta dark prata |
| `src/components/ui/input.tsx` | Fundo `white/[0.04]`, ring prata |
| `src/components/ui/button.tsx` | Adicionar variantes `clean` e `premium` |
| `src/pages/Login.tsx` | Container preto, logo ring prata, botões nas novas variantes |
| `src/pages/Home.tsx` | Verse card monocromático |
| `src/components/Layout.tsx` | Header/sidebar/bottom nav em preto + prata |

### Critérios de aceite atendidos

- ✅ Paleta dark (#0A0A0A base / #121212 superfície / branco-prata texto), mantida via tokens HSL
- ✅ Variante A (clean preto + borda prata) e Variante B (gradiente prata, texto #121212 — contraste AAA)
- ✅ Inputs com fundo `rgba(255,255,255,0.04)` + anel de foco prata visível
- ✅ Texto secundário em prata `#A3A3A3` via `--muted-foreground`
- ✅ Sombras pesadas substituídas por bordas finas `1px solid rgba(255,255,255,0.08)` e glows sutis
- ✅ Responsividade preservada (todas as classes `xs:/sm:/md:` mantidas)
- ✅ Lógica e estrutura de componentes intactas — só estilos mudam

### Observação

O Tailwind config (`tailwind.config.ts`) já mapeia `bg-primary`, `text-foreground`, etc. para os tokens HSL — então não preciso tocar nele. As páginas que não estão na lista (Bíblia, Galeria, Contato, etc.) também ficarão dark automaticamente porque usam os mesmos tokens semânticos.