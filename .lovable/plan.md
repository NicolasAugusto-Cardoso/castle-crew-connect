## Correções de cor residual

### 1. Aba Bíblia — remover vermelho residual
Em `src/pages/Bible.tsx`, trocar todas as ocorrências hardcoded de `neon-red` por `neon-white` (ou `page-primary`):
- Borda do header (linha 164)
- Borda do container do version selector (linha 176)
- Títulos "Salvos" e "Navegar" (linhas 218 e 223): `text-neon-red` → `text-neon-white`

Em `src/components/bible/BibleSavedSection.tsx` e `src/components/bible/BibleBookList.tsx`, trocar os fallbacks `var(--neon-red)` dentro de `var(--page-primary,var(--neon-red))` por `var(--neon-white)` para garantir consistência caso `--page-primary` não esteja injetado.

### 2. Aba Eventos — botão "Novo Evento" branco
Em `src/pages/Events.tsx`:
- Linha 185: `variant="neonGreen"` → `variant="neonWhite"` no botão "+ Novo Evento"
- Linhas 235 e 241: trocar variantes verdes do navegador de mês também para `neonWhite` (consistência)

### 3. Botões CTA com texto preto
Forçar texto escuro nos dois CTAs principais:
- `src/components/posts/CreatePostDialog.tsx` (linha 171): adicionar `!text-neutral-900` ao `Button "Criar Nova Postagem"`
- `src/components/gallery/CreateFolderDialog.tsx` (linha 95): adicionar `!text-neutral-900` ao `Button "Nova Pasta"`

(O `btn-gradient` já tem `color: #121212`, mas o componente `Button` do shadcn aplica `text-primary-foreground` por padrão na variante default, sobrescrevendo. O `!` garante prioridade.)

### Arquivos editados
- `src/pages/Bible.tsx`
- `src/components/bible/BibleSavedSection.tsx`
- `src/components/bible/BibleBookList.tsx`
- `src/pages/Events.tsx`
- `src/components/posts/CreatePostDialog.tsx`
- `src/components/gallery/CreateFolderDialog.tsx`
