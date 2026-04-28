## Melhorias na interação de versículos (aba Bíblia)

### 1. Toolbar centralizado e nunca cobrindo o versículo (`BibleVerseToolbar.tsx`)

- Trocar o cálculo de `left` baseado no `rect.left + rect.width / 2` por **centralização horizontal na viewport**: `left: 50%` com `transform: translateX(-50%)`.
- Manter a lógica vertical existente que já posiciona acima/abaixo do versículo conforme espaço disponível (nunca sobre o texto), mas:
  - Aumentar o `GAP` para `12px` para respiro visual.
  - Recalcular a posição da seta-pointer para apontar para o versículo (deslocamento horizontal calculado a partir do centro do `rect` do versículo em relação à viewport), já que o toolbar agora está centralizado.
- Refinar a animação de entrada usando classes Tailwind já presentes (`animate-in fade-in zoom-in-95`) com duração `180ms` e `ease-out` para uma transição mais suave e perceptível.

### 2. Modo de Leitura por versículo (`BibleVerseCard.tsx`)

- Importar o ícone `Eye` / `EyeOff` do `lucide-react`.
- Adicionar um botão de toggle **dentro do próprio `BibleVerseCard`** posicionado à direita do número do versículo (ou no canto superior direito ao lado do indicador de nota). Área clicável mínima `44x44px` (`h-11 w-11`) com `aria-label="Ativar/Desativar modo de leitura"`.
- Estado **local** ao componente: `const [readingMode, setReadingMode] = useState(false)`. Como cada `BibleVerseCard` já é um componente isolado e memoizável, essa mudança **não causa re-render dos outros versículos**.
- Envolver o componente com `React.memo` (e estabilizar callbacks no pai com `useCallback`) para garantir que apenas o card clicado re-renderize.
- Quando `readingMode === true`:
  - Aplicar `style={{ backgroundColor: '#FFFFFF', color: '#000000' }}` no container do versículo (sobrescreve `text-foreground`).
  - Forçar cor preta no `<sup>` do número e nos spans de highlight (mantendo a `backgroundColor` do grifo, mas com texto preto).
  - Transição instantânea: `transition-none` durante o toggle (sem `duration-*`), priorizando resposta imediata.
- O clique no botão Eye **chama `e.stopPropagation()`** para não disparar o `handleTap` que abre o toolbar.

### 3. Comportamento de toggle/reset

- Clicar novamente no ícone (agora `EyeOff`) desativa o modo.
- Clicar **fora** do versículo: adicionar listener `pointerdown` global montado apenas quando `readingMode === true` (cleanup no unmount), que desativa o modo se o clique ocorrer fora do `verseRef`.
- O botão Eye fica sempre visível no mobile (sem hover-only), seguindo a regra global de mobile-first.

### 4. Performance

- `React.memo(BibleVerseCard)` com comparação rasa padrão — props já são primitivas/estáveis exceto callbacks.
- No `BibleVerseReader.tsx`, envolver `handleCopyVerse`, `handleShareVerse`, `handleOpenNote`, `handleToggleFocus`, `handleAddHighlight`, `handleRemoveHighlightsForVerse` em `useCallback` com dependências corretas para que a memoização do card seja efetiva.
- Estado `readingMode` permanece **local ao card** — nenhuma lista é re-renderizada ao alternar.

### Arquivos a editar

- `src/components/bible/BibleVerseToolbar.tsx` — centralização horizontal + animação refinada + recalibração da seta.
- `src/components/bible/BibleVerseCard.tsx` — botão Eye, estado local de reading mode, estilo branco/preto, `React.memo`, listener de clique externo.
- `src/components/bible/BibleVerseReader.tsx` — envolver handlers em `useCallback` para preservar a memoização.
