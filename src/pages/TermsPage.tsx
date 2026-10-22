import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import LanguageMenu from '../components/navigation/LanguageMenu.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'

// #/terms (MVP-18): copyright notice, terms of use and privacy text approved by the owner on
// 2026-10-22 (Q13). Outside the app shell like the landing page, so visitors without a profile
// can read it. It reads and writes no learner data.

const TERMS = ['pilot', 'sample', 'assessment', 'ai', 'use', 'guarantee'] as const
const PRIVACY = ['account', 'device', 'recordings', 'tracking', 'hosting', 'delete'] as const

// Public contact given by the owner on 2026-10-22.
const CONTACT_HANDLE = '@Mr_rich_and_famous'
const CONTACT_URL = 'https://t.me/Mr_rich_and_famous'

// Links to this page pass the screen they came from, so Back returns there; otherwise to the landing page.
function backTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') ? from : '/'
}

export default function TermsPage() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <PageContainer>
        <header className="flex min-h-14 items-center justify-between gap-3 py-2">
          <Wordmark size="md" />
          <LanguageMenu />
        </header>
      </PageContainer>
      <main className="flex-1">
        <PageContainer className="flex flex-col gap-6 py-4 pb-14">
          <BackLink to={backTarget(location.state)} />
          <h1 className="text-h1">{t('legal.title')}</h1>
          <p className="text-body" data-copyright>
            {t('legal.copyright')}
          </p>

          <section aria-labelledby="terms-title" className="flex flex-col gap-3">
            <h2 id="terms-title" className="text-h2">
              {t('legal.termsTitle')}
            </h2>
            <ol className="flex list-decimal flex-col gap-3 pl-6 text-body">
              {TERMS.map((key) => (
                <li key={key} data-term={key}>
                  <strong>{t(`legal.terms.${key}.title`)}</strong> {t(`legal.terms.${key}.body`)}
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="privacy-title" className="flex flex-col gap-3">
            <h2 id="privacy-title" className="text-h2">
              {t('legal.privacyTitle')}
            </h2>
            <ul className="flex list-disc flex-col gap-3 pl-6 text-body">
              {PRIVACY.map((key) => (
                <li key={key} data-privacy={key}>
                  <strong>{t(`legal.privacy.${key}.title`)}</strong> {t(`legal.privacy.${key}.body`)}
                </li>
              ))}
              <li data-privacy="contact">
                <strong>{t('legal.contact')}</strong>{' '}
                <a
                  href={CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-pill underline underline-offset-2"
                >
                  {t('legal.contactLink', { handle: CONTACT_HANDLE })}
                  <span className="sr-only"> {t('legal.opensNewTab')}</span>
                </a>
              </li>
            </ul>
          </section>
        </PageContainer>
      </main>
    </div>
  )
}
