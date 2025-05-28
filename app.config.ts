import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Safest',
  slug: 'safest-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.safest.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.safest.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-location',
    '@react-native-firebase/app'
  ]
};

export default config; 