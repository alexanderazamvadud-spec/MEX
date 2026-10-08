import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

export const SUPPORTED_LANGUAGES = ['en', 'uz', 'ru'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

// Language names are always shown in their own language, whatever the current interface language.
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  uz: 'O‘zbekcha',
  ru: 'Русский',
}

// Key under which the chosen interface language is remembered in the browser.
// It stores one language code and no personal data.
const STORAGE_KEY = 'mex.language'

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

// Browser storage can be unavailable (private mode, blocked storage), so every
// failure falls back to the default language instead of breaking the app.
function readStoredLanguage(): SupportedLanguage {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function storeLanguage(language: string): void {
  if (!isSupportedLanguage(language)) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Remembering the language is a convenience only; the app keeps working without it.
  }
}

function applyDocumentLanguage(language: string): void {
  document.documentElement.lang = language
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uz: { translation: uz },
      ru: { translation: ru },
    },
    lng: readStoredLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false, // React already escapes rendered strings.
    },
  })
  .catch((error: unknown) => {
    console.error('MEX could not initialise translations.', error)
  })

i18n.on('languageChanged', (language) => {
  applyDocumentLanguage(language)
  storeLanguage(language)
})

applyDocumentLanguage(i18n.language)

export default i18n
