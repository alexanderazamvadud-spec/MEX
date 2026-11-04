import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

// Android app (APK-01). The web files are bundled inside the APK from dist-android/
// (built by `npm run build:android`); there is no server.url, so the app never loads
// the GitHub Pages site and works offline.
const config: CapacitorConfig = {
  appId: 'com.mex.app',
  appName: 'MEX',
  webDir: 'dist-android',
  android: {
    // The app runs on https://localhost inside the web view.
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      // Edge-to-edge drawing with correct env(safe-area-inset-*) values; the CSS in
      // src/styles/index.css pads the content and paints the blue status-bar strip.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
    SplashScreen: {
      // Hidden by src/native/android.ts once the app has rendered.
      launchAutoHide: false,
      backgroundColor: '#1F57C3',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      // The whole web view shrinks above the keyboard, so the focused field stays visible;
      // the bottom navigation hides while the keyboard is open (see index.css).
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
}

export default config
