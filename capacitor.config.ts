import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wird.app',
  appName: 'Wird',
  webDir: 'out',
  backgroundColor: '#0D4B3C',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0D4B3C',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0D4B3C',
      sound: 'adhan.mp3',
    },
  },
};

export default config;
