## Substituir os Logos do App

Vou trocar dois logos do app pelos novos arquivos enviados.

### 1. Copiar os novos arquivos enviados para `src/assets/`

- `user-uploads://Design_sem_nome_46.png` → `src/assets/castle-logo-header-v2.png` (logo "UNCT" largo, para o cabeçalho)
- `user-uploads://Design_sem_nome_47.png` → `src/assets/castle-logo-login-v2.png` (logo "UNCT" quadrado, para o círculo da tela de login)

### 2. Atualizar o cabeçalho do app

Em `src/components/Layout.tsx` (linha 9 e linha 72):
- Trocar o import `castle-app-home.png` por `castle-logo-header-v2.png`
- A `<img>` no centro do cabeçalho passará a usar o novo logo (mantendo as classes de tamanho `h-10 xs:h-11 sm:h-12 md:h-14 w-auto`)

### 3. Atualizar a tela de login

Em `src/pages/Login.tsx` (linha 10 e linha 166):
- Trocar o import `castle-logo-login-new.png` por `castle-logo-login-v2.png`
- A `<img>` dentro do círculo (`rounded-full ring-4 ring-primary`) passará a usar o novo logo, mantendo o estilo redondo e o fundo branco

### Observação

Os arquivos antigos (`castle-app-home.png`, `castle-logo-login-new.png`) ficarão na pasta `src/assets/` mas sem uso — posso removê-los também se você quiser limpar a pasta. Me avise.

### Resumo

| Local | Antes | Depois |
|---|---|---|
| Cabeçalho (Layout) | `castle-app-home.png` | `castle-logo-header-v2.png` |
| Login (círculo) | `castle-logo-login-new.png` | `castle-logo-login-v2.png` |