import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import LanguageButtons from '../components/navigation/LanguageButtons.tsx'
import ChoiceCard from '../components/onboarding/ChoiceCard.tsx'
import Button from '../components/ui/Button.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'
import { LEVELS, PATHWAY_IDS, type Level, type PathwayId } from '../content/index.ts'
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../i18n/index.ts'
import { GOALS, answersFromProfile, isComplete, withOnboardingProfile } from '../learner/profile.ts'
import type { Goal } from '../learner/types.ts'
import { useLearner } from '../learner/useLearner.ts'

// Onboarding (MVP-06b, Scope v2 screen S3): interface language, self-reported level,
// goals, first pathway. One question per step; answers are kept when going back.
// The profile is written once, on "Start learning". Leaving early saves nothing except
// the interface language, which i18n stores as soon as it is chosen (MVP-03).
// A returning learner sees their earlier answers; finishing again replaces only the profile.

const STEP_COUNT = 4

// Translation key segment for each pathway; the names and descriptions are the approved MVP-06 texts.
const PATHWAY_KEYS: Record<PathwayId, string> = {
  'general-english': 'generalEnglish',
  'career-readiness': 'careerReadiness',
}

export default function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { record, update, persistent } = useLearner()
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level | null>(() => record.profile?.level ?? null)
  const [goals, setGoals] = useState<Goal[]>(() => answersFromProfile(record.profile, DEFAULT_LANGUAGE).goals)
  const [pathway, setPathway] = useState<PathwayId | null>(() => record.profile?.pathway ?? null)
  const [showError, setShowError] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isFirstRender = useRef(true)
  const errorId = useId()
  const hintId = useId()
  const headingId = useId()

  // Move focus to the new question after Next or Back, so keyboard and screen-reader
  // users start at the top of the step. Not on first load: focus stays where the browser puts it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  function stepIsAnswered(): boolean {
    if (step === 1) return level !== null
    if (step === 2) return goals.length > 0
    if (step === 3) return pathway !== null
    return true
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stepIsAnswered()) {
      setShowError(true)
      return
    }
    setShowError(false)
    if (step < STEP_COUNT - 1) {
      setStep(step + 1)
      return
    }
    const resolved = i18n.resolvedLanguage ?? i18n.language
    const answers = {
      interfaceLanguage: isSupportedLanguage(resolved) ? resolved : DEFAULT_LANGUAGE,
      level,
      goals,
      pathway,
    }
    if (!isComplete(answers)) return
    update((current) => withOnboardingProfile(current, answers, new Date().toISOString()))
    navigate('/home')
  }

  function handleBack() {
    setShowError(false)
    setStep(step - 1)
  }

  function toggleGoal(goal: Goal, on: boolean) {
    setShowError(false)
    setGoals((current) => (on ? [...current, goal] : current.filter((item) => item !== goal)))
  }

  const errorKey = step === 2 ? 'onboarding.errors.chooseGoal' : 'onboarding.errors.chooseOne'
  const describedBy = [hintId, showError ? errorId : ''].filter(Boolean).join(' ')

  let question: string
  let hint: string
  let options: ReactNode
  if (step === 0) {
    question = t('onboarding.language.question')
    hint = t('onboarding.language.hint')
    options = <LanguageButtons />
  } else if (step === 1) {
    question = t('onboarding.level.question')
    hint = t('onboarding.level.note')
    options = LEVELS.map((item) => (
      <ChoiceCard
        key={item}
        type="radio"
        name="level"
        value={item}
        checked={level === item}
        onChange={() => {
          setShowError(false)
          setLevel(item)
        }}
        title={t(`onboarding.level.${item}.name`)}
        description={t(`onboarding.level.${item}.description`)}
      />
    ))
  } else if (step === 2) {
    question = t('onboarding.goals.question')
    hint = t('onboarding.goals.hint')
    options = GOALS.map((item) => (
      <ChoiceCard
        key={item}
        type="checkbox"
        name="goals"
        value={item}
        checked={goals.includes(item)}
        onChange={(event) => toggleGoal(item, event.target.checked)}
        title={t(`onboarding.goals.${item}`)}
      />
    ))
  } else {
    question = t('onboarding.pathway.question')
    hint = t('onboarding.pathway.hint')
    // Both pathways use the same card, with nothing preselected for a new learner and no
    // recommendation from the goals (General English is never equated with workplace readiness).
    options = PATHWAY_IDS.map((item) => (
      <ChoiceCard
        key={item}
        type="radio"
        name="pathway"
        value={item}
        checked={pathway === item}
        onChange={() => {
          setShowError(false)
          setPathway(item)
        }}
        title={t(`landing.pathways.${PATHWAY_KEYS[item]}.name`)}
        description={t(`landing.pathways.${PATHWAY_KEYS[item]}.body`)}
      />
    ))
  }

  const isLastStep = step === STEP_COUNT - 1

  return (
    <div className="flex min-h-dvh flex-col">
      <PageContainer>
        <header className="flex min-h-14 items-center justify-between gap-3 py-2">
          <Wordmark size="md" />
          <p className="text-small text-ink-secondary">{t('onboarding.stepCounter', { n: step + 1 })}</p>
        </header>
      </PageContainer>
      <main className="flex-1">
        <PageContainer className="py-4">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <fieldset aria-labelledby={headingId} aria-describedby={describedBy} className="flex min-w-0 flex-col gap-4">
              <h1 id={headingId} ref={headingRef} tabIndex={-1} className="text-h1">
                {question}
              </h1>
              <p id={hintId} className="text-body text-ink-secondary">
                {hint}
              </p>
              <div className="flex flex-col gap-3">{options}</div>
            </fieldset>

            {showError ? (
              <p id={errorId} role="alert" className="rounded-panel bg-error-tint px-4 py-3 text-body text-error-text">
                {t(errorKey)}
              </p>
            ) : null}

            {isLastStep && !persistent ? (
              <p role="status" className="rounded-panel bg-warning-tint px-4 py-3 text-body text-warning-text">
                {t('onboarding.storageNotice')}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {step > 0 ? (
                <Button variant="secondary" size="lg" onClick={handleBack}>
                  {t('onboarding.back')}
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <Button type="submit" variant="primary" size="lg">
                {isLastStep ? t('onboarding.start') : t('onboarding.next')}
              </Button>
            </div>
          </form>
        </PageContainer>
      </main>
    </div>
  )
}
