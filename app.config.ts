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
  extra: {
    eas: {
      projectId: '3f0e0cdf-81a2-4b65-a182-bf883ac599ad'
    }
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.safest.app',
    buildNumber: '8',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app needs access to your location to provide safety navigation and emergency services.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs access to your location to provide safety navigation and emergency services.',
      UIBackgroundModes: ['location', 'fetch'],
      ITSAppUsesNonExemptEncryption: false
    },
    config: {
      googleMapsApiKey: "AIzaSyA5NInDbok3Mu-WK8IIoylH1QpPTtYHyoY"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.safest.app',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION'
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow Safest to use your location for safety navigation and emergency services.'
      }
    ]
  ]
};

export default config; 