## Substituir o componente Splash pelo HTML/CSS enviado

Adotar exatamente o markup e o CSS do arquivo anexado em `src/components/Splash.tsx`, preservando a interface React (`onComplete`) e mantendo a integração já existente em `App.tsx` (abertura) e `Login.tsx` (após login).

### Mudanças em `src/components/Splash.tsx`

Reescrever o componente com a estrutura do HTML enviado:

- **Estrutura**:
  ```
  .uc-splash-container
    └─ .uc-logo-container
       ├─ .uc-drawing-line   (linha luminosa)
       └─ .uc-word-wrapper
          ├─ <span>unicris</span>
          ├─ <span class="uc-cross"></span>   (cruz no lugar do "t")
          └─ <span>o</span>
    └─ .uc-subtitle "TORNANDO JESUS MAIS CONHECIDO"
  ```

- **CSS**: copiar literalmente todas as regras (`.word-wrapper`, `.drawing-line`, `.cross`, `.subtitle`) e os keyframes (`revealText`, `moveLine`, `fadeOutLine`, `turnGold`, `fadeSubtitle`) dentro de uma tag `<style>` no componente. Prefixar as classes com `uc-` para isolar o escopo (evita colisão com Tailwind/outras classes).

- **Responsividade**: incluir as media queries do anexo:
  - `@media (max-width: 767px)` → fonte 24px, cruz 10×22px, subtítulo 8px.
  - `@media (min-width: 1200px)` → fonte 52px, cruz 22×46px, subtítulo 14px.
  - Faixa intermediária (768–1199px) → valores padrão (38px / 16×34px / 11px).

- **Container raiz**: `fixed inset-0 z-[9999]` com `background-color: #000000`, `display: flex`, centralizado, `font-family: 'Montserrat'`. Fade-out final de 200ms via keyframe `uc_splashFadeOut` aos 2900ms.

- **Tempo de vida**: `setTimeout(onComplete, 3100)` (1.8s reveal + 1s cruz dourada + 0.8s subtítulo + ~300ms respiro + fade-out 200ms já dentro da janela).

- **Interface**: manter `interface SplashProps { onComplete: () => void }` exportada como `export const Splash`, sem mudar nada em quem consome (`App.tsx` e `Login.tsx`).

### Arquivos não tocados

- `index.html` já carrega Montserrat (200/400) — sem alteração.
- `App.tsx` continua usando `<Splash />` como pre-splash.
- `Login.tsx` continua exibindo `<Splash />` após login bem-sucedido.

### Único arquivo alterado

- `src/components/Splash.tsx` — reescrito com o HTML/CSS do anexo (com classes prefixadas e adaptação para React).