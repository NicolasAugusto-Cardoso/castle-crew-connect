import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a451d4b96dd64800b70d61b5a786f131',
  appName: 'Castle Movement',
  webDir: 'dist',
  server: {
    url: 'https://a451d4b9-6dd6-4800-b70d-61b5a786f131.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2B96D9",
      showSpinner: false
    }
  }
};

export default config;
