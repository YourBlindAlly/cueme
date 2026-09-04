// Converted from app.json (2026-09-04) so a "preview" variant can be built
// with a different bundle identifier and display name — installing that
// build alongside the real app on the same phone gives it its own
// completely separate local storage, so a fresh-install/first-launch
// experience can be tried out with zero risk to the real library, setlists,
// or settings. Set APP_VARIANT=preview (see .github/workflows/build-preview-ipa.yml)
// to build that variant; unset/anything else builds the normal app exactly
// as before.
const isPreview = process.env.APP_VARIANT === 'preview';

module.exports = {
  expo: {
    name: isPreview ? 'CueMe Preview' : 'CueMe',
    slug: 'cueme-app',
    scheme: 'cueme',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#000000',
    ios: {
      supportsTablet: true,
      bundleIdentifier: isPreview ? 'com.rustyperez.cueme.preview' : 'com.rustyperez.cueme',
      infoPlist: {
        UIBackgroundModes: ['audio'],
        GCSupportsControllerUserInteraction: true,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#000000',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-audio',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          backgroundColor: '#000000',
          imageWidth: 260,
          resizeMode: 'contain',
        },
      ],
      'expo-localization',
    ],
  },
};
