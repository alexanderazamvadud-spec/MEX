import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import LanguageMenu from '../components/navigation/LanguageMenu.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import ButtonLink from '../components/ui/ButtonLink.tsx'
import Card from '../components/ui/Card.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'
import { PATHWAY_IDS, type PathwayId } from '../content/index.ts'

// Public landing page at #/ (MVP-06): introduces MEX to visitors. It is a marketing page,
// separate from onboarding; it reads and writes no learner data and never redirects,
// so returning learners reach the demo through the primary call to action.

// Translation key segment for each pathway. Both pathways are always shown with the same
// card, heading level and size, so neither appears secondary.
const PATHWAY_KEYS: Record<PathwayId, string> = {
  'general-english': 'generalEnglish',
  'career-readiness': 'careerReadiness',
}

const HOW_STEPS = ['choose', 'practise', 'track'] as const
const AUDIENCES = ['learners', 'employers', 'institutions'] as const
const AVAILABLE_NOW = ['pathways', 'lessons', 'exercises', 'readingListening', 'speaking', 'interview', 'writing', 'mission', 'progress', 'languages', 'delete'] as const
const PLANNED = ['coaching', 'recommendations', 'speaking', 'accounts', 'certificates'] as const

// Wider than the app's 560 px column so sections can sit side by side on larger screens.
function LandingContainer({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={['mx-auto w-full max-w-landing px-gutter', className].filter(Boolean).join(' ')}>{children}</div>
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-h2">
      {children}
    </h2>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()
  const pathwaysHeadingRef = useRef<HTMLHeadingElement>(null)

  // "Discover the Pathways" scrolls within the page instead of using an #anchor link,
  // because the hash already holds the route (#/) and an anchor would replace it.
  // Focus moves to the section heading so keyboard and screen-reader users land there too.
  function showPathways() {
    const heading = pathwaysHeadingRef.current
    if (!heading) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    heading.closest('section')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header>
        <LandingContainer className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <Wordmark size="md" />
          <div className="flex items-center gap-2">
            <LanguageMenu />
            <ButtonLink to="/home" variant="secondary" size="sm">
              {t('landing.header.demo')}
            </ButtonLink>
          </div>
        </LandingContainer>
      </header>

      <main className="flex-1">
        <LandingContainer className="flex flex-col gap-14 pt-2 pb-14 md:gap-20">
          {/* Hero */}
          <section
            aria-labelledby="landing-hero-title"
            className="relative isolate overflow-hidden rounded-card bg-primary px-5 py-9 text-on-primary [--focus-ring:var(--color-on-primary)] md:px-12 md:py-14"
          >
            {/* CSS-only decoration in the primary-hover shade; no images. */}
            <span
              aria-hidden="true"
              className="absolute -top-16 -right-16 -z-10 size-56 rounded-pill bg-primary-hover md:size-80"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-24 right-24 -z-10 hidden size-48 rounded-pill bg-primary-hover md:block"
            />
            <div className="flex max-w-[620px] flex-col items-start gap-5">
              <Badge variant="surface">{t('landing.hero.badge')}</Badge>
              <h1 id="landing-hero-title" className="text-display">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lead text-on-primary-muted">{t('landing.hero.body')}</p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <ButtonLink to="/home" variant="accent" size="lg">
                  {t('landing.hero.primaryCta')}
                </ButtonLink>
                <Button variant="secondary" size="lg" onClick={showPathways}>
                  {t('landing.hero.secondaryCta')}
                </Button>
              </div>
              <p className="text-small text-on-primary-muted">{t('landing.hero.demoNote')}</p>
            </div>
          </section>

          {/* Two learning pathways */}
          <section id="pathways" aria-labelledby="landing-pathways-title" className="flex scroll-mt-4 flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-label uppercase text-ink-muted">{t('landing.pathways.label')}</p>
              <h2 id="landing-pathways-title" ref={pathwaysHeadingRef} tabIndex={-1} className="text-h2">
                {t('landing.pathways.title')}
              </h2>
              <p className="text-body text-ink-secondary">{t('landing.pathways.intro')}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {PATHWAY_IDS.map((pathway) => {
                const key = PATHWAY_KEYS[pathway]
                return (
                  <Card key={pathway} as="li" variant="sky" className="gap-3 p-6" data-pathway={pathway}>
                    <h3 className="text-h3 text-primary">{t(`landing.pathways.${key}.name`)}</h3>
                    <p className="text-body">{t(`landing.pathways.${key}.body`)}</p>
                  </Card>
                )
              })}
            </ul>
          </section>

          {/* How MEX works */}
          <section aria-labelledby="landing-how-title" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <SectionHeading id="landing-how-title">{t('landing.how.title')}</SectionHeading>
              <p className="text-body text-ink-secondary">{t('landing.how.intro')}</p>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {HOW_STEPS.map((step, index) => (
                <Card key={step} as="li" variant="soft" className="gap-3 p-6">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-pill bg-primary text-[16px] font-extrabold text-on-primary"
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-h3">{t(`landing.how.${step}.title`)}</h3>
                  <p className="text-body text-ink-secondary">{t(`landing.how.${step}.body`)}</p>
                </Card>
              ))}
            </ol>
            <p className="text-small text-ink-secondary">{t('landing.how.note')}</p>
          </section>

          {/* Who MEX serves */}
          <section aria-labelledby="landing-audience-title" className="flex flex-col gap-5">
            <SectionHeading id="landing-audience-title">{t('landing.audience.title')}</SectionHeading>
            <ul className="grid gap-4 md:grid-cols-3">
              {AUDIENCES.map((audience) => (
                <Card key={audience} as="li" variant="soft" className="gap-3 p-6">
                  <h3 className="text-h3">{t(`landing.audience.${audience}.title`)}</h3>
                  <p className="text-body text-ink-secondary">{t(`landing.audience.${audience}.body`)}</p>
                </Card>
              ))}
            </ul>
          </section>

          {/* Prototype and privacy */}
          <section aria-labelledby="landing-status-title" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <SectionHeading id="landing-status-title">{t('landing.status.title')}</SectionHeading>
              <p className="text-body text-ink-secondary">{t('landing.status.intro')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card variant="soft" className="gap-3 p-6">
                <h3 className="text-h3">{t('landing.status.availableTitle')}</h3>
                <ul className="flex list-disc flex-col gap-1.5 pl-5">
                  {AVAILABLE_NOW.map((item) => (
                    <li key={item}>{t(`landing.status.available.${item}`)}</li>
                  ))}
                </ul>
              </Card>
              <Card variant="soft" className="gap-3 p-6">
                <h3 className="text-h3">{t('landing.status.plannedTitle')}</h3>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-ink-secondary">
                  {PLANNED.map((item) => (
                    <li key={item}>{t(`landing.status.planned.${item}`)}</li>
                  ))}
                </ul>
                <p className="text-small text-ink-secondary">{t('landing.status.plannedNote')}</p>
              </Card>
            </div>
            <Card as="section" variant="sky" className="gap-3 p-6" aria-labelledby="landing-privacy-title">
              <h3 id="landing-privacy-title" className="text-h3">
                {t('landing.privacy.title')}
              </h3>
              <p className="text-body">{t('landing.privacy.body')}</p>
              <p className="text-body">{t('landing.privacy.deleteHint')}</p>
              <div>
                <Link
                  to="/settings"
                  className="inline-flex min-h-11 items-center rounded-pill underline underline-offset-2"
                >
                  {t('landing.privacy.settingsLink')}
                </Link>
              </div>
            </Card>
          </section>
        </LandingContainer>
      </main>

      <footer className="border-t border-divider">
        <LandingContainer className="flex flex-col gap-1 py-6 text-small text-ink-secondary">
          <p>
            {t('landing.footer.copyright')} {t('landing.footer.sample')}
          </p>
          <p>{t('landing.footer.note')}</p>
          <div>
            <Link
              to="/terms"
              state={{ from: '/' }}
              className="inline-flex min-h-11 items-center rounded-pill underline underline-offset-2"
            >
              {t('legal.link')}
            </Link>
          </div>
        </LandingContainer>
      </footer>
    </div>
  )
}
