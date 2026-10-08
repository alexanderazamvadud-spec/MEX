import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageButtons from './LanguageButtons.tsx'
import { DEFAULT_LANGUAGE, LANGUAGE_NAMES, isSupportedLanguage, type SupportedLanguage } from '../../i18n/index.ts'

// Compact language pill for the top bar. It shows the current language code and
// opens a small panel with the three language buttons. The panel closes after a
// choice, on Escape, or on a click outside; focus returns to the pill.
export default function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const resolved = i18n.resolvedLanguage ?? i18n.language
  const currentLanguage: SupportedLanguage = isSupportedLanguage(resolved) ? resolved : DEFAULT_LANGUAGE

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        pillRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    const firstButton = rootRef.current?.querySelector<HTMLButtonElement>('[role="group"] button')
    firstButton?.focus()
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleSelect() {
    setOpen(false)
    pillRef.current?.focus()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={pillRef}
        type="button"
        aria-label={`${t('language.label')}: ${currentLanguage.toUpperCase()}, ${LANGUAGE_NAMES[currentLanguage]}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={
          'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill bg-surface-sky px-4 text-[13px] font-extrabold ' +
          'uppercase text-primary transition-colors duration-150 hover:bg-track motion-reduce:transition-none ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'
        }
      >
        {currentLanguage}
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute top-full right-0 z-10 mt-2 rounded-panel border border-divider bg-surface p-3"
        >
          <LanguageButtons onSelect={handleSelect} className="flex-col items-start" />
        </div>
      ) : null}
    </div>
  )
}
