import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ChoiceItem, { GapSentence } from '../exercise/ChoiceItem.tsx'
import Feedback from '../exercise/Feedback.tsx'
import MatchingItem from '../exercise/MatchingItem.tsx'
import OrderingItem from '../exercise/OrderingItem.tsx'
import BackLink from '../learn/BackLink.tsx'
import ActivitySummary from '../summary/ActivitySummary.tsx'
import { ACTIVITY_TYPE_KEYS } from '../learn/text.ts'
import NativeText from '../lesson/NativeText.tsx'
import Badge from '../ui/Badge.tsx'
import Button from '../ui/Button.tsx'
import Switch from '../ui/Switch.tsx'
import { isPlaceholder } from '../../content/index.ts'
import { LANGUAGE_NAMES } from '../../i18n/index.ts'
import {
  checkAnswer,
  emptyAnswer,
  isComplete,
  withExerciseResult,
  type Answer,
  type ExerciseItem,
} from '../../learner/exercise.ts'
import { explanationsOn, withCompletion, withNativeExplanations } from '../../learner/lesson.ts'
import { completedActivityIds } from '../../learner/progress.ts'
import { useLearner } from '../../learner/useLearner.ts'
import type { Skill } from '../../content/types.ts'
import type { ActivityPageProps } from '../../pages/activityPageProps.ts'

// The question flow shared by the exercise player (MVP-10, S9) and the reading and
// listening players (MVP-11, S10 and S11). One question per screen: the learner answers and taps Check, which locks the
// answer, shows right or wrong with the item's explanation, and saves one result with the
// item's skills (demonstrated-skills layer; readiness never changes). One attempt per item;
// replaying the exercise saves new results and keeps the old ones. After the last question the
// activity summary (MVP-14) shows the score as practice and records completion whatever the score.
// Leaving early keeps the saved results, does not complete the activity, and a return
// starts again at question 1. Prompts and options stay English; the native toggle (Q3)
// adds the UZ/RU instructions and explanations. `intro` (a reading text or the listening
// controls) is shown above every question, and `skillsFor` lets a player change the skills
// a result is saved with (text-only listening counts as reading).

interface Step {
  answer: Answer
  checked: boolean
  correct: boolean
}

const HINT_KEYS: Record<ExerciseItem['kind'], string> = {
  'multiple-choice': 'exercise.chooseAnswer',
  'gap-fill': 'exercise.fillGap',
  matching: 'exercise.chooseMatch',
  ordering: 'exercise.tapInOrder',
}

const ERROR_KEYS: Record<ExerciseItem['kind'], string> = {
  'multiple-choice': 'exercise.errors.choose',
  'gap-fill': 'exercise.errors.choose',
  matching: 'exercise.errors.match',
  ordering: 'exercise.errors.place',
}

/** The right answer shown in the feedback panel; matching shows it per pair instead. */
function rightAnswer(item: ExerciseItem): string | null {
  if (item.kind === 'matching') return null
  if (item.kind === 'ordering') return item.segments.join(' ')
  return item.answer
}

export default function QuestionPlayer({
  pathway,
  pack,
  unit,
  activity,
  items,
  intro,
  skillsFor = (item) => item.skills,
}: ActivityPageProps & {
  items: ExerciseItem[]
  intro?: ReactNode
  skillsFor?: (item: ExerciseItem) => Skill[]
}) {
  const { t, i18n } = useTranslation()
  const { record, update } = useLearner()
  const [index, setIndex] = useState(0)
  const [steps, setSteps] = useState<Step[]>(() =>
    items.map((item) => ({ answer: emptyAnswer(item), checked: false, correct: false })),
  )
  const [showError, setShowError] = useState(false)
  const [finished, setFinished] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const headingId = useId()
  const hintId = useId()
  const errorId = useId()

  const step = steps[index]
  const checked = step?.checked ?? false

  // Focus follows the learner: to the feedback after Check, to the next question after Next,
  // and to the score on the results screen. Not on first load.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (finished || !checked) headingRef.current?.focus()
    else feedbackRef.current?.focus()
  }, [index, checked, finished])

  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const showNative = nativeLanguage !== null && explanationsOn(record)
  const native = showNative ? nativeLanguage : null
  const completed = completedActivityIds(pathway, record.completions).has(activity.id)
  const unitPath = `/learn/${pathway}/${unit.id}`
  const item = items[index]

  function setAnswer(answer: Answer) {
    setShowError(false)
    setSteps((current) => current.map((entry, at) => (at === index ? { ...entry, answer } : entry)))
  }

  function check() {
    if (!item || !step || step.checked) return
    if (!isComplete(item, step.answer)) {
      setShowError(true)
      return
    }
    const correct = checkAnswer(item, step.answer)
    const now = new Date().toISOString()
    update((current) =>
      withExerciseResult(current, { pathway, activityId: activity.id, itemId: item.id, skills: skillsFor(item), correct, answeredAt: now }),
    )
    setSteps((current) => current.map((entry, at) => (at === index ? { ...entry, checked: true, correct } : entry)))
  }

  // After the last question the summary opens, and that is when the activity counts as completed.
  function next() {
    if (index < items.length - 1) {
      setIndex(index + 1)
      return
    }
    const now = new Date().toISOString()
    update((current) => withCompletion(current, { pathway, unitId: unit.id, activityId: activity.id }, now))
    setFinished(true)
  }

  const header = (
    <>
      <BackLink to={unitPath} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 empty:hidden">
          {isPlaceholder(pack.content_status) ? <Badge variant="sky">{t('home.sampleContent')}</Badge> : null}
          {completed ? <Badge variant="success">{t('learn.done')}</Badge> : null}
        </div>
        <h1 lang="en" className="text-h1">
          {activity.title}
        </h1>
        <p className="text-small text-ink-secondary">
          {t(`learn.types.${ACTIVITY_TYPE_KEYS[activity.type]}`)} · {t('learn.minutes', { n: activity.estimatedMinutes })}
        </p>
      </div>
    </>
  )

  if (finished || !item || !step) {
    const right = steps.filter((entry) => entry.correct).length
    return (
      <ActivitySummary
        pathway={pathway}
        pack={pack}
        unit={unit}
        activity={activity}
        recap={
          <>
            <p className="font-bold">{t('exercise.score', { n: right, total: items.length })}</p>
            <p>{t('exercise.practiceNote')}</p>
          </>
        }
      />
    )
  }

  const isLast = index === items.length - 1
  const describedBy = [hintId, showError ? errorId : ''].filter(Boolean).join(' ')
  const value = step.answer.kind === 'choice' ? step.answer.value : null

  return (
    <div className="flex flex-col gap-5">
      {header}

      {nativeLanguage ? (
        <div className="rounded-panel bg-surface-soft px-4 py-3">
          <Switch
            checked={showNative}
            onChange={(on) => update((current) => withNativeExplanations(current, on))}
            label={t('lesson.toggle', { language: LANGUAGE_NAMES[nativeLanguage] })}
            hint={t('exercise.toggleHint')}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p lang="en" className="text-body">
          {activity.instructions.en}
        </p>
        <NativeText text={activity.instructions} language={native} />
      </div>

      {intro}

      <section aria-labelledby={headingId} aria-describedby={describedBy} data-item={item.id} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-ink-muted">
            {t('exercise.progress', { n: index + 1, total: items.length })}
          </p>
          <h2 id={headingId} ref={headingRef} tabIndex={-1} lang="en" className="text-h2">
            {item.kind === 'gap-fill' ? <GapSentence item={item} value={value} /> : item.prompt}
          </h2>
          <p id={hintId} className="text-body text-ink-secondary">
            {t(HINT_KEYS[item.kind])}
          </p>
        </div>

        {item.kind === 'matching' ? (
          <MatchingItem item={item} answer={step.answer} onChange={setAnswer} checked={checked} />
        ) : item.kind === 'ordering' ? (
          <OrderingItem item={item} answer={step.answer} onChange={setAnswer} checked={checked} />
        ) : (
          <ChoiceItem item={item} answer={step.answer} onChange={setAnswer} checked={checked} legendId={headingId} />
        )}
      </section>

      {showError ? (
        <p id={errorId} role="alert" className="rounded-panel bg-error-tint px-4 py-3 text-body text-error-text">
          {t(ERROR_KEYS[item.kind])}
        </p>
      ) : null}

      {checked ? (
        <Feedback
          ref={feedbackRef}
          correct={step.correct}
          answer={rightAnswer(item)}
          explanation={item.explanation}
          native={native}
        />
      ) : null}

      <div>
        {checked ? (
          <Button variant="primary" size="lg" onClick={next}>
            {isLast ? t('exercise.seeResults') : t('exercise.next')}
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={check}>
            {t('exercise.check')}
          </Button>
        )}
      </div>
    </div>
  )
}
