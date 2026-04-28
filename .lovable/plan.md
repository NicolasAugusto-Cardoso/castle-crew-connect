## Correções: toolbar overflow + reading mode multi-versículo

### 1. Toolbar não pode ultrapassar a tela (`BibleVerseToolbar.tsx`)

Atualmente as 5 cores + 3 ícones + divisor estouram em telas estreitas (390px). Ajustes:

- Adicionar `flex-wrap` e `justify-center` no container para permitir quebra em duas linhas se necessário.
- Limitar largura: `style={{ maxWidth: 'calc(100vw - 16px)' }}`.
- Reduzir tamanho das bolinhas de cor no mobile: `h-6 w-6 sm:h-7 sm:w-7` (eram fixas em `h-7 w-7`).
- Reduzir margem do divisor de `mx-1` → `mx-0.5` e altura `h-6` → `h-5`.
- Manter o `left: 50%` + `translateX(-50%)` (centralizado) e a seta com offset apontando para o versículo.

Resultado: cabe confortavelmente em 390px sem cortar nenhum botão; em telas ainda menores quebra para 2 linhas em vez de overflow.

### 2. Modo de Leitura ativável em múltiplos versículos (`BibleVerseCard.tsx`)

Atualmente cada card tem um `useEffect` que desliga o `readingMode` ao detectar `pointerdown` fora do próprio container — isso impede ter dois versículos em modo leitura simultaneamente (clicar no segundo desliga o primeiro).

Mudança:
- **Remover** o listener de "clique fora desliga". O Modo de Leitura passa a ser puramente toggle pelo ícone Eye/EyeOff.
- Manter `e.stopPropagation()` no botão para não disparar o seletor de toolbar do versículo.
- Cada card mantém seu estado local independente — vários versículos podem coexistir em modo leitura.
- O toggle continua: clicar no `EyeOff` desativa apenas aquele versículo.

### Arquivos a editar
- `src/components/bible/BibleVerseToolbar.tsx`
- `src/components/bible/BibleVerseCard.tsx`
