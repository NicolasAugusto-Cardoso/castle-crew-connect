import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.castlemovement.app',
  appName: 'Castle Movement',
  webDir: 'dist',
  // Remove this server block for production builds
  // Uncomment only for development with hot-reload
  // server: {
  //   url: 'https://a451d4b9-6dd6-4800-b70d-61b5a786f131.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#2B96D9",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;
