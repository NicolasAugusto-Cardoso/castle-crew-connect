## Nova vinheta "UniCristo" — Splash de abertura + após login

Substituir o componente atual de splash (gradiente azul + texto "Castle App") por uma vinheta minimalista preta com:
- Cruz dourada à esquerda
- Palavra **unicristo** revelada por uma linha luminosa branca que "desenha" o texto
- Subtítulo **TORNANDO JESUS MAIS CONHECIDO** em cinza
- Duração total ~3s (fiel ao HTML enviado)

Exibida tanto ao abrir o app quanto após login bem-sucedido (antes de cair na Home).

---

### 1. Reescrever `src/components/Splash.tsx`

Trocar todo o conteúdo atual (gradiente azul, glows e partículas douradas + título "Castle / App") pela nova animação:

- **Fundo**: `bg-black` puro (`#000000`), `fixed inset-0 z-[9999]`.
- **Fonte**: usar Montserrat (peso 200 para o título, 400 para o subtítulo). Carregar via `<link>` no `index.html` ao lado do Outfit já existente.
- **Estrutura**:
  - Container vertical centralizado.
  - Linha do logo: `[cruz] u n i c r i s t o` com `letter-spacing: 8px`, fonte 38px, cor branca.
  - Cruz minimalista: dois traços (vertical 100% × 2px e horizontal 100% × 2px posicionado a 30% do topo) dentro de um bloco `16px × 34px`.
  - Linha luminosa branca (2px) que percorre o container do texto da esquerda para a direita em 1.8s, com `box-shadow` branco para efeito de brilho.
  - O texto usa `clip-path: inset(0 100% 0 0)` animado para `inset(0 0 0 0)` em sincronia com a linha (revelação progressiva).
  - Após 1.8s a linha some (fade 0.3s).
  - Aos 2.0s a cruz transita de branco para dourado `#D4AF37` com glow dourado (`box-shadow: 0 0 10px rgba(212,175,55,0.8)`).
  - Aos 2.3s o subtítulo "TORNANDO JESUS MAIS CONHECIDO" faz fade-in (cor `#888`, 11px, `letter-spacing: 5px`).
- **Implementação técnica**:
  - Manter a interface `SplashProps { onComplete: () => void }`.
  - Usar Framer Motion já presente (compatível) **ou** keyframes CSS inline em `<style>` dentro do componente (mais fiel ao HTML). Vou usar keyframes CSS para preservar exatamente o ritmo `revealText`, `moveLine`, `fadeOutLine`, `turnGold`, `fadeSubtitle`.
  - Timer total: **3000ms** (1.8s reveal + 0.5s pausa + 0.7s margem para o subtítulo respirar) antes de chamar `onComplete`. Saída com fade 200ms.
  - Remover dependência de partículas, glows e referências a `--primary` / `--accent` — paleta puramente preta/branca/dourada.

### 2. Ajustar `src/App.tsx` (pre-splash)

Trocar o `PreSplashScreen` (atualmente `bg-gradient-to-br from-primary-light via-primary to-primary-dark`) para `bg-black`, evitando o flash azul antes da splash. Mesmo ajuste no fallback de `ProtectedLayout` quando `loading`.

### 3. Mostrar splash após login

Em `src/pages/Login.tsx`, no `handleLogin` quando o login retorna sucesso (antes do `navigate('/')` ou redirect automático):

- Adicionar estado `const [showPostLoginSplash, setShowPostLoginSplash] = useState(false)`.
- Ao login OK, setar `showPostLoginSplash(true)` em vez de redirecionar imediatamente.
- Renderizar `<Splash onComplete={() => navigate('/')} />` quando o estado for `true` (ocupa tela inteira via `fixed z-[9999]`, então cobre o card de login durante a transição).
- Não tocar no header/card visual da tela de Login (mantém UniCristo + logo atual).

### 4. Atualizar `index.html`

Adicionar a fonte Montserrat (pesos 200 e 400) ao lado do Outfit já existente:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;400&display=swap" rel="stylesheet">
```

### 5. Atualizar memória

Atualizar `mem://design/splash-screen-animation-and-effects` com a nova vinheta (fundo preto, cruz dourada, "unicristo" desenhado por linha luminosa, subtítulo "TORNANDO JESUS MAIS CONHECIDO", Montserrat 200/400, ~3s) e marcar que ela aparece também após login bem-sucedido.

---

### Arquivos alterados

- `src/components/Splash.tsx` — reescrito
- `src/App.tsx` — `PreSplashScreen` e fallback de loading com `bg-black`
- `src/pages/Login.tsx` — exibir splash após login antes de navegar
- `index.html` — incluir fonte Montserrat
- `mem://design/splash-screen-animation-and-effects` — atualizado

Sem mudanças em backend, banco ou rotas.