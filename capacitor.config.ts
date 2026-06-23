import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familyorders.app',
  appName: 'Family Orders',
  webDir: 'dist',
  server: {
    url: 'https://family-order-hub.vercel.app', 
    cleartext: true
  }
};

export default config;