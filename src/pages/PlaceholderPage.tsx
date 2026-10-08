import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n/index.ts'

// Temporary placeholder shown until the real screens are built (MVP-03 onwards).
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
    <PageContainer>
      <main className="flex flex-col gap-6 py-10">
        <Wordmark as="h1" />
        <p className="text-lead text-ink-secondary">{t('app.subtitle')}</p>
        <p className="text-body">{t('placeholder.status')}</p>
        <div role="group" className="flex flex-wrap gap-3">
          {SUPPORTED_LANGUAGES.map((language) => (
            <Button
              key={language}
              size="sm"
              variant={currentLanguage === language ? 'primary' : 'secondary'}
              lang={language}
              aria-pressed={currentLanguage === language}
              onClick={() => handleLanguageChange(language)}
            >
              {LANGUAGE_NAMES[language]}
            </Button>
          ))}
        </div>
      </main>
    </PageContainer>
  )
}
