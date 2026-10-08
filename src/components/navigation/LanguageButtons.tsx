import { useTranslation } from 'react-i18next'
import Button from '../ui/Button.tsx'
import { CheckIcon } from '../icons/NavIcons.tsx'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../../i18n/index.ts'

// The three interface-language buttons. The active language is marked by colour,
// a checkmark and aria-pressed, so the choice is never conveyed by colour alone.
export default function LanguageButtons({
  onSelect,
  className = 'flex-wrap',
}: {
  onSelect?: (language: SupportedLanguage) => void
  /** Layout classes for the group; defaults to a wrapping row. */
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const resolved = i18n.resolvedLanguage ?? i18n.language
  const currentLanguage: SupportedLanguage = isSupportedLanguage(resolved) ? resolved : DEFAULT_LANGUAGE

  function handleSelect(language: SupportedLanguage) {
    i18n
      .changeLanguage(language)
      .then(() => onSelect?.(language))
      .catch((error: unknown) => {
        console.error('MEX could not change the interface language.', error)
      })
  }

  return (
    <div role="group" aria-label={t('language.label')} className={['flex gap-3', className].join(' ')}>
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = currentLanguage === language
        return (
          <Button
            key={language}
            size="sm"
            variant={active ? 'primary' : 'secondary'}
            lang={language}
            aria-pressed={active}
            onClick={() => handleSelect(language)}
          >
            {active ? <CheckIcon width={16} height={16} /> : null}
            {LANGUAGE_NAMES[language]}
          </Button>
        )
      })}
    </div>
  )
}
