import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import ConfidenceScale from '../components/interview/ConfidenceScale.tsx'
import ListenButton from '../components/interview/ListenButton.tsx'
import BackLink from '../components/learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../components/learn/text.ts'
import NativeText from '../components/lesson/NativeText.tsx'
import ChoiceCard from '../components/onboarding/ChoiceCard.tsx'
import Recorder from '../components/speaking/Recorder.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import Switch from '../components/ui/Switch.tsx'
import { isPlaceholder } from '../content/index.ts'
import type { InterviewQuestionItem } from '../content/types.ts'
import { LANGUAGE_NAMES } from '../i18n/index.ts'
import { explanationsOn, withCompletion, withNativeExplanations } from '../learner/lesson.ts'
import { completedActivityIds } from '../learner/progress.ts'
import { browserRecording } from '../learner/recording.ts'
import { MAX_ANSWER_LENGTH, newSelfAssessmentId, withSelfAssessment } from '../learner/selfAssessment.ts'
import type { Confidence } from '../learner/types.ts'
import { useLearner } from '../learner/useLearner.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Guided interview practice (MVP-13, Scope v2 screen S13, decisions Q3 and Q7). One question
// per screen: the question (with an on-device voice when there is one), useful phrases, a
// typed answer and/or an optional recording, the model answers on request, a self-check and an
// optional 1-5 confidence. All of it is self-assessment: "Next question" and "Finish" save the
// question as a SelfAssessment (the typed answer on this device only; recordings are never
// saved), Finish records completion, and readiness on Home is unchanged until MVP-15.

interface Answer {
  text: string
  checks: boolean[]
  confidence: Confidence | null
}

function QuestionScreen({
  item,
  number,
  total,
  native,
  answer,
  onChange,
}: {
  item: InterviewQuestionItem
  number: number
  total: number
  native: 'uz' | 'ru' | null
  answer: Answer
  onChange: (answer: Answer) => void
}) {
  const { t } = useTranslation()
  const [engine] = useState(browserRecording)
  const [modelsShown, setModelsShown] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const id = (part: string) => `${item.id}-${part}`

  // A new question takes focus, so screen readers and the scroll position start at it.
  useEffect(() => {
    if (number > 1) heading.current?.focus()
  }, [number])

  return (
    <div className="flex flex-col gap-6" data-item={item.id}>
      <section aria-labelledby={id('question')} className="flex flex-col gap-3 rounded-card bg-surface-sky p-5">
        <p className="text-small font-bold text-ink-secondary">{t('interview.questionOf', { n: number, total })}</p>
        <h2 id={id('question')} ref={heading} tabIndex={-1} lang="en" className="text-h2 outline-none">
          {item.question}
        </h2>
        <ListenButton text={item.question} label={t('interview.listen')} />
      </section>

      <section aria-labelledby={id('phrases')} className="flex flex-col gap-3">
        <h3 id={id('phrases')} className="text-h3">
          {t('interview.phrases')}
        </h3>
        <ul lang="en" className="flex list-disc flex-col gap-1.5 pl-5 text-body">
          {item.usefulPhrases.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={id('answer')} className="flex flex-col gap-3" data-step="answer">
        <h3 id={id('answer')} className="text-h3">
          {t('interview.answer')}
        </h3>
        <label className="flex flex-col gap-2">
          <span className="text-body font-bold">{t('interview.typeLabel')}</span>
          <textarea
            lang="en"
            rows={5}
            maxLength={MAX_ANSWER_LENGTH}
            value={answer.text}
            onChange={(event) => onChange({ ...answer, text: event.target.value })}
            aria-describedby={id('saved')}
            className={
              'w-full rounded-panel border-2 border-outline bg-surface p-4 text-body text-ink ' +
              'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'
            }
          />
        </label>
        <p id={id('saved')} className="text-small text-ink-secondary">
          {t('interview.savedNote')}
        </p>
        <div className="rounded-card bg-surface-sky p-5">
          <Recorder engine={engine} />
        </div>
      </section>

      <section aria-labelledby={id('model')} className="flex flex-col gap-3" data-step="model">
        <h3 id={id('model')} className="text-h3">
          {t('interview.models')}
        </h3>
        {modelsShown ? (
          <div className="flex flex-col gap-3">
            {item.modelAnswers.map((model, index) => (
              <div key={model} className="flex flex-col gap-1 rounded-card bg-surface-soft p-5" data-model="true">
                <p className="text-small font-bold text-ink-secondary">{t('interview.example', { n: index + 1 })}</p>
                <p lang="en" className="text-body">
                  {model}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="secondary" size="md" onClick={() => setModelsShown(true)}>
              {t('interview.showModels')}
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby={id('check')} className="flex flex-col gap-3" data-step="check">
        <h3 id={id('check')} className="text-h3">
          {t('interview.check')}
        </h3>
        <p className="text-body text-ink-secondary">{t('interview.selfNote')}</p>
        <div className="flex flex-col gap-3">
          {item.selfCheck.map((line, index) => (
            <ChoiceCard
              key={line.en}
              type="checkbox"
              name={id('check')}
              value={String(index)}
              checked={answer.checks[index] ?? false}
              onChange={(event) =>
                onChange({ ...answer, checks: answer.checks.map((value, at) => (at === index ? event.target.checked : value)) })
              }
              title={line.en}
              description={native ? line[native] : undefined}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3" data-step="confidence">
        <ConfidenceScale
          name={id('confidence')}
          value={answer.confidence}
          onChange={(confidence) => onChange({ ...answer, confidence })}
        />
      </section>
    </div>
  )
}

export default function InterviewPracticePage({ pathway, pack, unit, activity }: ActivityPageProps) {
  const { t, i18n } = useTranslation()
  const { record, update } = useLearner()
  const navigate = useNavigate()
  const items = activity.items.filter((item): item is InterviewQuestionItem => item.kind === 'interview-question')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() =>
    items.map((item) => ({ text: '', checks: item.selfCheck.map(() => false), confidence: null })),
  )

  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const showNative = nativeLanguage !== null && explanationsOn(record)
  const native = showNative ? nativeLanguage : null
  const completed = completedActivityIds(pathway, record.completions).has(activity.id)
  const unitPath = `/learn/${pathway}/${unit.id}`
  const item = items[index]
  const last = index === items.length - 1

  function save(finish: boolean) {
    const now = new Date().toISOString()
    const answer = answers[index]
    const text = answer.text.trim().slice(0, MAX_ANSWER_LENGTH)
    update((current) => {
      const next = withSelfAssessment(current, {
        id: newSelfAssessmentId(now),
        kind: 'interview-question',
        pathway,
        activityId: activity.id,
        itemId: item.id,
        skills: item.skills,
        ...(text ? { answerText: text } : {}),
        selfCheck: answer.checks,
        ...(answer.confidence ? { confidence: answer.confidence } : {}),
        recordedAt: now,
      })
      return finish ? withCompletion(next, { pathway, unitId: unit.id, activityId: activity.id }, now) : next
    })
    if (finish) navigate(unitPath)
    else setIndex(index + 1)
  }

  if (!item) return null

  return (
    <div className="flex flex-col gap-5">
      <BackLink to={unitPath} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {isPlaceholder(pack.content_status) ? <Badge variant="sky">{t('home.sampleContent')}</Badge> : null}
          <Badge variant="accent-tint">{t('home.readiness.label')}</Badge>
          {completed ? <Badge variant="success">{t('learn.done')}</Badge> : null}
        </div>
        <h1 lang="en" className="text-h1">
          {activity.title}
        </h1>
        <p className="text-small text-ink-secondary">
          {t(`learn.types.${ACTIVITY_TYPE_KEYS[activity.type]}`)} · {t('learn.minutes', { n: activity.estimatedMinutes })}
        </p>
      </div>

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

      {/* Keyed by question, so the recording and the shown model answers start fresh. */}
      <QuestionScreen
        key={item.id}
        item={item}
        number={index + 1}
        total={items.length}
        native={native}
        answer={answers[index]}
        onChange={(answer) => setAnswers((current) => current.map((value, at) => (at === index ? answer : value)))}
      />

      <div>
        {last ? (
          <Button variant="accent" size="lg" onClick={() => save(true)}>
            {t('interview.finish')}
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => save(false)}>
            {t('interview.next')}
          </Button>
        )}
      </div>
    </div>
  )
}
