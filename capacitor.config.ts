import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memoria.app',
  appName: 'Memoria',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  server: {
    // Remove allowMixedContent here as it's not a valid property directly under server
  }
};

export default config;
