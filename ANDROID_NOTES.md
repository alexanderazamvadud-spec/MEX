# MEX Android app: notes (task APK-01)

The website at https://alexanderazamvadud-spec.github.io/MEX/ is packaged as an Android app with Capacitor. GitHub Actions builds the APK and publishes it at a fixed address:

https://github.com/alexanderazamvadud-spec/MEX/releases/latest/download/MEX.apk

## 0. What the web app is (inspected 2026-11-04, commit be30973)

| Question | Answer |
|---|---|
| Framework and build tool | React 19 + TypeScript 6, built with Vite 8; Tailwind CSS 4; i18next; react-router 8 |
| Build command and output | `npm run build` (`tsc -b && vite build`) writes the website to `dist/` |
| GitHub Pages deploy | `.github/workflows/deploy.yml` (GitHub Actions; Pages source is "GitHub Actions"). Runs `npm ci`, the content check, the unit tests and the build, then deploys `dist/`. |
| Places that assume `/MEX/` | Only `base: '/MEX/'` in `vite.config.ts`. There is no `homepage` in package.json, no hard-coded `/MEX/...` path and no router basename: routing is hash-based (`#/home`). |
| External resources | None at run time. Fonts (Manrope, a Noto Sans apostrophe subset) are self-hosted; no CDN scripts, no font services, no APIs. |
| Browser features used | `localStorage` (learner record and language); microphone through `getUserMedia` and `MediaRecorder` (speaking and interview practice, recordings stay in memory until the page closes); the browser's text-to-speech (`speechSynthesis`, on-device voices only) for "Listen" buttons. No IndexedDB, camera, file upload, geolocation or notifications. |
| Dialogs, new windows, hover | No `alert`/`confirm`/`prompt` and no `window.open`. One external link: the Telegram contact link on the Terms page (`target="_blank"`). Hover effects only darken colours; nothing appears only on hover. |

## 1. What changed for Android

- **Base path.** `vite.config.ts` uses `/MEX/` for the website and relative `./` URLs for `npm run build:android` (`vite build --mode android`, output in `dist-android/`). The website build was compared file by file before and after this change: identical.
- **Capacitor 8.6.** `capacitor.config.ts`: app id `com.mex.app`, name MEX, web files bundled from `dist-android/` (no `server.url`, so the app works offline). Plugins: app, status bar, splash screen, keyboard, browser.
- **Edge-to-edge and safe areas.** `index.html` has `viewport-fit=cover`. `src/styles/index.css` pads the page by `env(safe-area-inset-*)`, paints a `#1F57C3` strip behind the status bar, pads the bottom navigation above the gesture bar, and keeps full-height screens between the safe areas. On a desktop browser all insets are 0, so the website looks as before.
- **Native behaviour** (`src/native/android.ts`, runs only inside the app):
  - Light status-bar icons on blue; dark navigation-bar icons on white; a blue status bar on Android 14 and older too.
  - Back button: closes an open menu first, otherwise goes back; on the landing page and Home it exits the app.
  - Links to other sites open in the system browser.
  - Keyboard: the web view shrinks above the keyboard (`resize: native`), the focused field scrolls into view, and the bottom navigation hides while typing.
  - Splash screen: blue with the MEX mark, hidden as soon as the app has started.
- **Touch.** No tap-highlight flash; controls are not text-selectable (reading content is); text fields use 16 px or more; no overscroll bounce.
- **Signing and versions.** One fixed debug key (GitHub secrets `ANDROID_DEBUG_KEYSTORE_BASE64` and `ANDROID_DEBUG_KEYSTORE_PASSWORD`), so each new APK installs as an update and keeps the learner's progress. versionCode is the GitHub run number; versionName is 0.1.0 until a `v*` tag.
- **Workflow.** `.github/workflows/android.yml` builds on every push to main, on `v*` tags and on demand, uploads the artifact `MEX-debug-apk`, and replaces `MEX.apk` on the `latest-build` release.

## 2. Build it yourself

Requires Node.js 24 and, for the APK, JDK 21 and the Android SDK (Android Studio installs both).

```bash
npm ci
npm run build:android
npx cap sync android
cd android && ./gradlew assembleDebug
```

The APK is in `android/app/build/outputs/apk/debug/`. To check the Android web build in a browser first: `npx vite preview --outDir dist-android`.

## 3. Install on a phone

Open the download link above on an Android phone, tap Download, open the file, allow "Install unknown apps" for your browser when asked, then tap Install. Newer builds install over older ones and keep the learner's progress.

## 4. Make a versioned release

```bash
git tag v1.0.0
git push --tags
```

The workflow then also creates a release named `v1.0.0` with `MEX.apk` attached; its versionName is `v1.0.0`.

**Optional signed release build:** add the secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`, and the workflow also builds `assembleRelease` (artifact `MEX-release-apk`). Without them the step is skipped. Never commit a keystore or a password.

## 5. Fix log

One line per root cause found while building the Android app.

- Local MVP-06 work from 2026-10-09 was stale: GitHub `main` already had MVP-06 to MVP-18 (pull requests #1 to #15). The local work was saved as a stash and a patch; the Android work starts from `main` at be30973.
- Android 15+ ignores status-bar colours (apps always draw edge-to-edge), so the blue status bar is painted by CSS behind a transparent bar; the native colour still applies on Android 14 and older.

## 6. Needs a real phone to verify

- Notch, rounded corners and gesture-bar padding on real hardware.
- The on-screen keyboard over the text boxes in interview and writing practice.
- Microphone permission prompt and recording in speaking and interview practice.
- "Listen" buttons: Android's web view usually has no text-to-speech, so these buttons may report that no English voice is available in the app.
- Installing an update over an earlier build keeps progress.
