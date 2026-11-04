import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar } from '@capacitor/status-bar'

// Behaviour that only applies inside the Android app (APK-01). On the website
// Capacitor reports the "web" platform and nothing here runs.

/** Screens where the Android back button closes the app instead of going back. */
const EXIT_PATHS = new Set(['/', '/home'])

function currentPath(): string {
  // Hash routing: "#/learn/general-english" -> "/learn/general-english".
  const path = window.location.hash.replace(/^#/, '').split('?')[0]
  return path === '' ? '/' : path
}

/**
 * Closes an open menu or dialog, if any, by sending it Escape (every MEX popup already
 * closes on Escape). Returns true when something was open.
 */
function closeOpenOverlay(): boolean {
  const open =
    document.querySelector('dialog[open]') ??
    document.querySelector('[role="dialog"]') ??
    document.querySelector('[aria-expanded="true"]')
  if (!open) return false
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  return true
}

/** Links to other sites open in the system browser instead of taking the app's web view away. */
function openExternalLinksInBrowser(): void {
  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented) return
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return
      const url = new URL(link.href, window.location.href)
      const external = (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== window.location.origin
      if (!external) return
      event.preventDefault()
      Browser.open({ url: url.href, toolbarColor: '#1F57C3' }).catch((error: unknown) => {
        console.error('MEX could not open the link.', error)
      })
    },
    true,
  )
}

export async function initAndroid(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return
  document.documentElement.classList.add('native-android')

  // Light icons on the blue status bar, dark icons on the white navigation area.
  await Promise.allSettled([
    SystemBars.setStyle({ style: SystemBarsStyle.Dark, bar: SystemBarType.StatusBar }),
    SystemBars.setStyle({ style: SystemBarsStyle.Light, bar: SystemBarType.NavigationBar }),
    // Android 14 and older: blue status bar behind the icons (not available on Android 15+,
    // where the CSS strip in index.css paints it).
    StatusBar.setBackgroundColor({ color: '#1F57C3' }),
  ])

  App.addListener('backButton', ({ canGoBack }) => {
    if (closeOpenOverlay()) return
    if (EXIT_PATHS.has(currentPath()) || !canGoBack) {
      App.exitApp()
      return
    }
    window.history.back()
  })

  openExternalLinksInBrowser()

  // Keep the focused field visible and hide the bottom navigation while typing.
  Keyboard.addListener('keyboardWillShow', () => {
    document.documentElement.classList.add('keyboard-open')
  })
  Keyboard.addListener('keyboardDidShow', () => {
    const field = document.activeElement
    if (field instanceof HTMLElement) field.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.classList.remove('keyboard-open')
  })

  await SplashScreen.hide()
}
