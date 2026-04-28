## Unificar scroll da aba Bíblia (eliminar Double Scroll)

### Diagnóstico

O `<main>` global do `Layout.tsx` já tem `overflow-y-auto` e é o único container de scroll desejado. A página Bíblia hoje cria scrollers internos aninhados:

1. `src/pages/Bible.tsx` linha 161 — `h-[calc(100vh-4rem)]` trava a página na altura da viewport.
2. `src/pages/Bible.tsx` linha 188 — wrapper do reading view com `overflow-hidden`.
3. `src/pages/Bible.tsx` linha 203 — wrapper de navegação com `overflow-y-auto`.
4. `src/components/bible/BibleVerseReader.tsx` linha 277 — área de versículos com `overflow-y-auto`.
5. `src/components/bible/BibleBookList.tsx` linha 89 — grade de livros com `max-h-[calc(100vh-22rem)] overflow-y-auto`.
6. `src/components/bible/BibleChapterSelector.tsx` linha 47 — grade de capítulos com `max-h-[calc(100vh-20rem)] overflow-y-auto`.

Isso gera as duas barras visíveis no print (uma do `<main>`, outra interna).

### Mudanças

**`src/pages/Bible.tsx`**
- Trocar wrapper raiz `flex flex-col h-[calc(100vh-4rem)]` por `flex flex-col min-h-full` — o conteúdo passa a empurrar a altura natural.
- No bloco de leitura (linha 187-200): remover `flex-1 flex flex-col min-h-0` e `overflow-hidden`. Deixar apenas `bg-background px-4 py-4 sm:px-6`.
- No bloco de navegação (linha 203): remover `flex-1 flex flex-col min-h-0 overflow-y-auto`. Manter apenas `px-4 py-4 sm:px-6`.
- Tornar o header (linha 163-181) `sticky top-0 z-20` (com fundo já existente) para permanecer visível enquanto o scroll global rola.

**`src/components/bible/BibleVerseReader.tsx`**
- Remover `h-full min-h-0` do wrapper raiz (linha 217).
- Remover `flex-1 overflow-y-auto` do container de versículos (linha 277). O conteúdo simplesmente flui.
- Manter o header interno como `sticky top-[X] z-10`. Como o header da página acima também fica sticky, ajustar o `top` do header do reader para `top-0` apenas quando em modo leitura (o header de página é ocultado em `isReading`, então `top-0` continua correto).

**`src/components/bible/BibleBookList.tsx`**
- Linha 89: remover `max-h-[calc(100vh-22rem)] overflow-y-auto pr-1`. Manter `pb-24` para folga sobre a nav inferior. A grid passa a fluir e contribuir para a altura da página.

**`src/components/bible/BibleChapterSelector.tsx`**
- Linha 47: remover `max-h-[calc(100vh-20rem)] overflow-y-auto pr-1`.

### Comportamento resultante
- Apenas o `<main>` do Layout rola. Sem scroll interno em nenhuma área da Bíblia.
- O header "Bíblia + seletor de versão" fica sticky no topo enquanto o usuário rola a lista de livros/capítulos.
- No modo leitura, o header com botões de navegação de capítulo fica sticky no topo do `<main>`.
- Sem barras de rolagem horizontais (mantido `overflow-x-hidden` global do `<main>`).

### Arquivos editados
- `src/pages/Bible.tsx`
- `src/components/bible/BibleVerseReader.tsx`
- `src/components/bible/BibleBookList.tsx`
- `src/components/bible/BibleChapterSelector.tsx`
