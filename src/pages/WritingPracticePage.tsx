import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../components/learn/text.ts'
import NativeText from '../components/lesson/NativeText.tsx'
import ChoiceCard from '../components/onboarding/ChoiceCard.tsx'
import ActivitySummary from '../components/summary/ActivitySummary.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import Switch from '../components/ui/Switch.tsx'
import { isPlaceholder } from '../content/index.ts'
import type { WritingTaskItem } from '../content/types.ts'
import { LANGUAGE_NAMES } from '../i18n/index.ts'
import { explanationsOn, withCompletion, withNativeExplanations } from '../learner/lesson.ts'
import { completedActivityIds } from '../learner/progress.ts'
import { MAX_WRITING_LENGTH, newSelfAssessmentId, withSelfAssessment } from '../learner/selfAssessment.ts'
import { useLearner } from '../learner/useLearner.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Writing practice (MVP-16b, Scope v2 CR-4 "writing task with checklist"). The task, an
// optional text box, the model email on request and a checklist the learner ticks. It is
// self-assessment: nothing reads, checks or corrects the text, and there is no AI. Finish
// saves one SelfAssessment per task (the typed text on this device only) and a completion;
// writing never counts towards demonstrated skills or readiness.

function WritingTask({
  item,
  native,
  text,
  checks,
  onText,
  onChecks,
}: {
  item: WritingTaskItem
  native: 'uz' | 'ru' | null
  text: string
  checks: boolean[]
  onText: (text: string) => void
  onChecks: (checks: boolean[]) => void
}) {
  const { t } = useTranslation()
  const [modelShown, setModelShown] = useState(false)
  const id = (part: string) => `${item.id}-${part}`

  return (
    <div className="flex flex-col gap-6" data-item={item.id}>
      <div className="flex flex-col gap-3 rounded-card bg-surface-sky p-5" data-step="task">
        <p lang="en" className="text-lead">
          {item.task.en}
        </p>
        <NativeText text={item.task} language={native} />
      </div>

      <section aria-labelledby={id('email')} className="flex flex-col gap-3" data-step="write">
        <h2 id={id('email')} className="text-h3">
          {t('writing.yourEmail')}
        </h2>
        <label className="flex flex-col gap-2">
          <span className="sr-only">{t('writing.yourEmail')}</span>
          <textarea
            lang="en"
            rows={9}
            maxLength={MAX_WRITING_LENGTH}
            value={text}
            onChange={(event) => onText(event.target.value)}
            aria-describedby={id('saved')}
            className={
              'w-full rounded-panel border-2 border-outline bg-surface p-4 text-body text-ink ' +
              'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'
            }
          />
        </label>
        <p id={id('saved')} className="text-small text-ink-secondary">
          {t('writing.savedNote')}
        </p>
      </section>

      <section aria-labelledby={id('model')} className="flex flex-col gap-3" data-step="model">
        <h2 id={id('model')} className="text-h3">
          {t('writing.model')}
        </h2>
        {modelShown ? (
          <p lang="en" className="rounded-card bg-surface-soft p-5 text-body whitespace-pre-line" data-model="true">
            {item.model}
          </p>
        ) : null}
        <div>
          <Button variant="secondary" size="md" aria-expanded={modelShown} onClick={() => setModelShown((shown) => !shown)}>
            {modelShown ? t('writing.hideModel') : t('writing.showModel')}
          </Button>
        </div>
      </section>

      <section aria-labelledby={id('check')} className="flex flex-col gap-3" data-step="check">
        <h2 id={id('check')} className="text-h3">
          {t('writing.check')}
        </h2>
        <p className="text-body text-ink-secondary">{t('writing.checkNote')}</p>
        <div className="flex flex-col gap-3">
          {item.checklist.map((line, index) => (
            <ChoiceCard
              key={line.en}
              type="checkbox"
              name={id('check')}
              value={String(index)}
              checked={checks[index] ?? false}
              onChange={(event) => onChecks(checks.map((value, at) => (at === index ? event.target.checked : value)))}
              title={line.en}
              description={native ? line[native] : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function WritingPracticePage({ pathway, pack, unit, activity }: ActivityPageProps) {
  const { t, i18n } = useTranslation()
  const { record, update } = useLearner()
  const [done, setDone] = useState(false)
  const items = activity.items.filter((item): item is WritingTaskItem => item.kind === 'writing-task')
  const [texts, setTexts] = useState<string[]>(() => items.map(() => ''))
  const [checks, setChecks] = useState<boolean[][]>(() => items.map((item) => item.checklist.map(() => false)))

  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const showNative = nativeLanguage !== null && explanationsOn(record)
  const native = showNative ? nativeLanguage : null
  const completed = completedActivityIds(pathway, record.completions).has(activity.id)
  const unitPath = `/learn/${pathway}/${unit.id}`

  function finish() {
    const now = new Date().toISOString()
    update((current) => {
      const saved = items.reduce((next, item, index) => {
        const text = texts[index].trim().slice(0, MAX_WRITING_LENGTH)
        return withSelfAssessment(next, {
          id: newSelfAssessmentId(now),
          kind: 'writing-task',
          pathway,
          activityId: activity.id,
          itemId: item.id,
          skills: item.skills,
          ...(text ? { answerText: text } : {}),
          selfCheck: checks[index],
          recordedAt: now,
        })
      }, current)
      return withCompletion(saved, { pathway, unitId: unit.id, activityId: activity.id }, now)
    })
    setDone(true)
  }

  if (done) {
    const all = checks.flat()
    return (
      <ActivitySummary
        pathway={pathway}
        pack={pack}
        unit={unit}
        activity={activity}
        selfAssessment
        recap={<p>{t('summary.selfCheckRecap', { n: all.filter(Boolean).length, total: all.length })}</p>}
      />
    )
  }

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

      {items.map((item, index) => (
        <WritingTask
          key={item.id}
          item={item}
          native={native}
          text={texts[index]}
          checks={checks[index]}
          onText={(text) => setTexts((current) => current.map((value, at) => (at === index ? text : value)))}
          onChecks={(next) => setChecks((current) => current.map((value, at) => (at === index ? next : value)))}
        />
      ))}

      <div>
        <Button variant="accent" size="lg" onClick={finish}>
          {t('writing.finish')}
        </Button>
      </div>
    </div>
  )
}
