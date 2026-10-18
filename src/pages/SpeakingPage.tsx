import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../components/learn/text.ts'
import NativeText from '../components/lesson/NativeText.tsx'
import ChoiceCard from '../components/onboarding/ChoiceCard.tsx'
import Countdown from '../components/speaking/Countdown.tsx'
import ActivitySummary from '../components/summary/ActivitySummary.tsx'
import ModelAnswer from '../components/speaking/ModelAnswer.tsx'
import Recorder from '../components/speaking/Recorder.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import Switch from '../components/ui/Switch.tsx'
import { isPlaceholder } from '../content/index.ts'
import type { SpeakingItem } from '../content/types.ts'
import { LANGUAGE_NAMES } from '../i18n/index.ts'
import { explanationsOn, withCompletion, withNativeExplanations } from '../learner/lesson.ts'
import { completedActivityIds } from '../learner/progress.ts'
import { browserRecording } from '../learner/recording.ts'
import { newSelfAssessmentId, withSelfAssessment } from '../learner/selfAssessment.ts'
import { useLearner } from '../learner/useLearner.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Speaking practice (MVP-12, Scope v2 screen S12, decisions Q3 and Q7). One screen with five
// numbered steps: the task and hints, a 60-second preparation timer, a 30-second speaking
// timer with optional on-device recording, the model answer, and a self-check. Timers only
// guide. Speaking is self-assessed and labelled so: "Finish speaking" saves the ticked boxes
// as a self-assessment (never "assessed" or "demonstrated") and records completion; it does
// not change readiness. Recordings never leave the screen (see src/learner/recording.ts).

const PREPARE_SECONDS = 60
const SPEAK_SECONDS = 30

type Timer = 'prepare' | 'speak' | null

function StepHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-h3">
      {children}
    </h2>
  )
}

function SpeakingTask({
  item,
  native,
  checks,
  onCheck,
}: {
  item: SpeakingItem
  native: 'uz' | 'ru' | null
  checks: boolean[]
  onCheck: (index: number, on: boolean) => void
}) {
  const { t } = useTranslation()
  const [timer, setTimer] = useState<Timer>(null)
  const [engine] = useState(browserRecording)
  const stopTimer = useCallback(() => setTimer(null), [])
  const id = (step: string) => `${item.id}-${step}`

  return (
    <div className="flex flex-col gap-6" data-item={item.id}>
      <section aria-labelledby={id('task')} className="flex flex-col gap-3">
        <StepHeading id={id('task')}>{t('speaking.task')}</StepHeading>
        <p lang="en" className="text-lead font-bold">
          {item.prompt.en}
        </p>
        <NativeText text={item.prompt} language={native} />
        <ul lang="en" className="flex list-disc flex-col gap-1.5 pl-5 text-body">
          {item.preparationHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={id('prepare')} className="flex flex-col gap-3 rounded-card bg-surface-sky p-5" data-step="prepare">
        <StepHeading id={id('prepare')}>{t('speaking.prepare')}</StepHeading>
        <Countdown seconds={PREPARE_SECONDS} running={timer === 'prepare'} onDone={stopTimer} />
        <div className="flex flex-wrap gap-3">
          {timer === 'prepare' ? (
            <Button variant="tertiary" size="md" onClick={stopTimer}>
              {t('speaking.ready')}
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => setTimer('prepare')}>
              {t('speaking.startPreparing')}
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby={id('speak')} className="flex flex-col gap-4 rounded-card bg-surface-sky p-5" data-step="speak">
        <StepHeading id={id('speak')}>{t('speaking.speak')}</StepHeading>
        <Countdown seconds={SPEAK_SECONDS} running={timer === 'speak'} onDone={stopTimer} />
        <div>
          <Button variant="primary" size="md" onClick={() => setTimer('speak')} disabled={timer === 'speak'}>
            {t('speaking.startSpeaking')}
          </Button>
        </div>
        <Recorder engine={engine} />
      </section>

      <section aria-labelledby={id('model')} className="flex flex-col gap-3" data-step="model">
        <StepHeading id={id('model')}>{t('speaking.model')}</StepHeading>
        <ModelAnswer text={item.modelAnswer} />
      </section>

      <section aria-labelledby={id('check')} className="flex flex-col gap-3" data-step="check">
        <StepHeading id={id('check')}>{t('speaking.check')}</StepHeading>
        <p className="text-body text-ink-secondary">{t('speaking.selfNote')}</p>
        <div className="flex flex-col gap-3">
          {item.selfCheck.map((line, index) => (
            <ChoiceCard
              key={line.en}
              type="checkbox"
              name={`${item.id}-check`}
              value={String(index)}
              checked={checks[index] ?? false}
              onChange={(event) => onCheck(index, event.target.checked)}
              title={line.en}
              description={native ? line[native] : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function SpeakingPage({ pathway, pack, unit, activity }: ActivityPageProps) {
  const { t, i18n } = useTranslation()
  const { record, update } = useLearner()
  const [done, setDone] = useState(false)
  const items = activity.items.filter((item): item is SpeakingItem => item.kind === 'speaking')
  const [checks, setChecks] = useState<boolean[][]>(() => items.map((item) => item.selfCheck.map(() => false)))

  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const showNative = nativeLanguage !== null && explanationsOn(record)
  const native = showNative ? nativeLanguage : null
  const completed = completedActivityIds(pathway, record.completions).has(activity.id)
  const unitPath = `/learn/${pathway}/${unit.id}`

  function finish() {
    const now = new Date().toISOString()
    update((current) => {
      let next = current
      items.forEach((item, index) => {
        next = withSelfAssessment(next, {
          id: newSelfAssessmentId(now),
          kind: 'speaking',
          pathway,
          activityId: activity.id,
          itemId: item.id,
          skills: item.skills,
          selfCheck: checks[index],
          recordedAt: now,
        })
      })
      return withCompletion(next, { pathway, unitId: unit.id, activityId: activity.id }, now)
    })
    setDone(true)
  }

  if (done) {
    const ticked = checks.flat().filter(Boolean).length
    return (
      <ActivitySummary
        pathway={pathway}
        pack={pack}
        unit={unit}
        activity={activity}
        selfAssessment
        recap={<p>{t('summary.selfCheckRecap', { n: ticked, total: checks.flat().length })}</p>}
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
        <SpeakingTask
          key={item.id}
          item={item}
          native={native}
          checks={checks[index]}
          onCheck={(at, on) =>
            setChecks((current) => current.map((list, i) => (i === index ? list.map((value, j) => (j === at ? on : value)) : list)))
          }
        />
      ))}

      <div>
        <Button variant="accent" size="lg" onClick={finish}>
          {t('speaking.finish')}
        </Button>
      </div>
    </div>
  )
}
