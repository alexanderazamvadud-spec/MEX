import { useTranslation } from 'react-i18next'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n/index.ts'

// Temporary placeholder shown until the real screens are built (MVP-02 onwards).
// It is intentionally unstyled: only layout spacing is applied, no visual identity.
export default function PlaceholderPage() {
  const { t, i18n } = useTranslation()
  const resolved = i18n.resolvedLanguage ?? i18n.language
  const currentLanguage: SupportedLanguage = isSupportedLanguage(resolved) ? resolved : DEFAULT_LANGUAGE

  function handleLanguageChange(language: SupportedLanguage) {
    i18n.changeLanguage(language).catch((error: unknown) => {
      console.error('MEX could not change the interface language.', error)
    })
  }

  return (
    <main className="p-6 space-y-3">
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
      <p>{t('placeholder.status')}</p>
      <div role="group" className="flex flex-wrap gap-3">
        {SUPPORTED_LANGUAGES.map((language) => (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={currentLanguage === language}
            onClick={() => handleLanguageChange(language)}
          >
            {LANGUAGE_NAMES[language]}
          </button>
        ))}
      </div>
    </main>
  )
}
