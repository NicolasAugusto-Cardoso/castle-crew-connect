# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a451d4b9-6dd6-4800-b70d-61b5a786f131

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a451d4b9-6dd6-4800-b70d-61b5a786f131) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a451d4b9-6dd6-4800-b70d-61b5a786f131) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 📱 Build Android com Capacitor

### Configuração Atual

- **App ID**: `com.castlemovement.app`
- **App Name**: Castle Movement
- **Web Directory**: `dist` (gerado pelo Vite)

### Como gerar o projeto Android

#### 1. Build do projeto web
```sh
npm run build
```
Este comando gera a pasta `dist/` com os arquivos otimizados do app.

#### 2. Sincronizar com Android
```sh
npx cap sync android
```
Este comando:
- Copia os arquivos web de `dist/` para o projeto Android
- Atualiza plugins nativos
- Gera/atualiza a pasta `android/` com o projeto nativo

#### 3. Abrir no Android Studio
```sh
npx cap open android
```
Ou abra manualmente a pasta `android/` no Android Studio.

### Comandos completos (sequência)

```sh
# Gerar build + sincronizar Android
npm run build && npx cap sync android

# Abrir no Android Studio
npx cap open android
```

### No Android Studio

Após abrir o projeto:
1. Aguarde o Gradle sincronizar as dependências
2. Conecte um dispositivo Android ou inicie um emulador
3. Clique em **Run** (▶️) para testar o app
4. Para gerar APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. Para gerar AAB: **Build → Generate Signed Bundle / APK**

### Arquivos importantes do Android

- `android/app/src/main/AndroidManifest.xml` - Configurações e permissões
- `android/app/build.gradle` - Dependências e versões
- `android/app/src/main/res/values/strings.xml` - Nome do app
- `android/app/src/main/res/` - Ícones e recursos nativos

### Notas

- O projeto já está configurado com Splash Screen nativa (cor: `#2B96D9`)
- Push Notifications já está integrado via `@capacitor/push-notifications`
- Para builds de produção, o servidor de desenvolvimento está desabilitado no `capacitor.config.ts`
