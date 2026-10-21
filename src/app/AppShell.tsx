import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import BottomNav from '../components/navigation/BottomNav.tsx'
import TopBar from '../components/navigation/TopBar.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'

// The bottom-navigation section each address belongs to, for the browser tab title.
const SECTIONS = ['home', 'learn', 'progress', 'settings'] as const

// Layout for every app screen: top bar, the screen itself, and the bottom navigation.
// After moving to another screen, focus goes to the new screen's h1 so keyboard and
// screen-reader users start at the top of it (MVP-17 quality pass); the tab title names
// the section.
export default function AppShell() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const shownPath = useRef(pathname)
  const section = SECTIONS.find((name) => pathname === `/${name}` || pathname.startsWith(`/${name}/`))

  useEffect(() => {
    document.title = section ? `${t(`nav.${section}`)} · MEX` : 'MEX'
  }, [section, t, i18n.resolvedLanguage])

  useEffect(() => {
    // Not on first load: the browser starts at the top of the page by itself.
    if (shownPath.current === pathname) return
    shownPath.current = pathname
    const main = mainRef.current
    if (!main) return
    // Screens that load content show their h1 a moment later, so wait for it.
    function focusHeading(): boolean {
      const heading = main?.querySelector<HTMLElement>('h1')
      if (!heading) return false
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
      return true
    }
    if (focusHeading()) return
    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect()
    })
    observer.observe(main, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <PageContainer>
        <TopBar />
      </PageContainer>
      <main ref={mainRef} className="flex-1">
        <PageContainer className="py-4">
          <Outlet />
        </PageContainer>
      </main>
      <BottomNav />
    </div>
  )
}
