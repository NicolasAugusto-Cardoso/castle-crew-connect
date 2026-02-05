
# Plano: Atualizar Logo do PWA/Capacitor e Remover Banner de Instalacao

## 1. Substituir imagem do logo nos icones do PWA

Copiar a imagem enviada (`LOGO_APP.png`) para os seguintes locais no projeto, substituindo os icones atuais:

- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/apple-touch-icon.png`
- `public/favicon.png`

Esses sao os icones usados pelo PWA (manifest) e pelo Capacitor como base para gerar os icones nativos. A imagem sera a mesma para todos (o navegador redimensiona automaticamente).

## 2. Remover banner "Adicionar a tela inicial"

Excluir os seguintes arquivos:

| Arquivo | Motivo |
|---------|--------|
| `src/components/InstallPWABanner.tsx` | Componente do banner |
| `src/hooks/usePWAInstall.ts` | Hook de logica do banner |
| `src/pages/Install.tsx` | Pagina de instrucoes de instalacao |

## 3. Limpar referencias nos arquivos existentes

**`src/components/Layout.tsx`:**
- Remover import do `InstallPWABanner`
- Remover o componente `<InstallPWABanner />` do JSX

**`src/App.tsx`:**
- Remover import do `Install`
- Remover a rota `<Route path="/install" element={<Install />} />`

## Resumo

| Arquivo | Acao |
|---------|------|
| `public/pwa-192x192.png` | Substituir pela imagem enviada |
| `public/pwa-512x512.png` | Substituir pela imagem enviada |
| `public/apple-touch-icon.png` | Substituir pela imagem enviada |
| `public/favicon.png` | Substituir pela imagem enviada |
| `src/components/InstallPWABanner.tsx` | Excluir |
| `src/hooks/usePWAInstall.ts` | Excluir |
| `src/pages/Install.tsx` | Excluir |
| `src/components/Layout.tsx` | Remover referencias ao banner |
| `src/App.tsx` | Remover rota `/install` |
