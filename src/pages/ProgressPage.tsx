import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import MeterBar from '../components/progress/MeterBar.tsx'
import ReadinessDetails from '../components/progress/ReadinessDetails.tsx'
import Badge from '../components/ui/Badge.tsx'
import Card from '../components/ui/Card.tsx'
import ContentLoadError from '../components/ui/ContentLoadError.tsx'
import { PATHWAY_IDS, type ContentPack, type PathwayId } from '../content/index.ts'
import { usePackResult } from '../content/usePack.ts'
import { completedActivityIds, unitCompletion } from '../learner/progress.ts'
import { readiness } from '../learner/readiness.ts'
import { demonstratedSkills } from '../learner/skills.ts'
import type { ActivityCompletion } from '../learner/types.ts'
import { useLearner } from '../learner/useLearner.ts'

// Progress screen (MVP-15, Scope v2 screen S15 and section 3): curriculum completion,
// demonstrated skills and readiness, always as three separate sections and never added
// into one number. Read-only, so it has no saffron action.

const PATHWAY_KEYS: Record<PathwayId, string> = {
  'general-english': 'generalEnglish',
  'career-readiness': 'careerReadiness',
}

function Layer({ title, badge, body, children, ...rest }: { title: string; badge?: string; body: string; children: ReactNode; 'data-layer': string }) {
  const headingId = useId()
  return (
    <Card as="section" variant="soft" className="gap-4 p-5" aria-labelledby={headingId} {...rest}>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={headingId} className="text-h3">
            {title}
          </h2>
          {badge ? <Badge variant="sky">{badge}</Badge> : null}
        </div>
        <p className="text-body text-ink-secondary">{body}</p>
      </div>
      {children}
    </Card>
  )
}

function PathwayCompletion({
  pathway,
  pack,
  failed,
  completions,
}: {
  pathway: PathwayId
  pack: ContentPack | null
  failed: boolean
  completions: readonly ActivityCompletion[]
}) {
  const { t } = useTranslation()
  const done = completedActivityIds(pathway, completions)
  const units = pack?.units ?? []
  const activities = units.flatMap((unit) => unit.activities)
  const doneActivities = activities.filter((activity) => done.has(activity.id)).length
  const doneUnits = units.filter((unit) => unitCompletion(unit, done).status === 'completed').length
  return (
    <li className="flex flex-col gap-1.5" data-pathway={pathway} aria-busy={(!pack && !failed) || undefined}>
      <h3 className="text-body font-extrabold text-primary">{t(`landing.pathways.${PATHWAY_KEYS[pathway]}.name`)}</h3>
      {pack ? (
        <>
          <MeterBar value={doneActivities} total={activities.length} />
          <p className="text-body">{t('progress.curriculum.activities', { done: doneActivities, total: activities.length })}</p>
          <p className="text-small text-ink-secondary">{t('progress.curriculum.units', { done: doneUnits, total: units.length })}</p>
        </>
      ) : null}
    </li>
  )
}

export default function ProgressPage() {
  const { t } = useTranslation()
  const { record } = useLearner()
  const general = usePackResult('general-english')
  const career = usePackResult('career-readiness')
  const results = { 'general-english': general, 'career-readiness': career }
  const failed = general.failed || career.failed
  const current = record.profile?.pathway ?? PATHWAY_IDS[0]
  const order = [current, ...PATHWAY_IDS.filter((pathway) => pathway !== current)]
  const skills = demonstratedSkills(record.exerciseResults)
  const level = readiness(record)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.progress')}</h1>
      <p className="text-body text-ink-secondary">{t('progress.intro')}</p>

      <Layer title={t('progress.curriculum.title')} body={t('progress.curriculum.body')} data-layer="curriculum">
        {failed ? <ContentLoadError /> : null}
        <ul className="flex flex-col gap-4">
          {order.map((pathway) => (
            <PathwayCompletion key={pathway} pathway={pathway} pack={results[pathway].pack} failed={results[pathway].failed} completions={record.completions} />
          ))}
        </ul>
      </Layer>

      <Layer title={t('progress.skills.title')} body={t('progress.skills.body')} data-layer="skills">
        <ul className="flex flex-col gap-4">
          {skills.map((item) => (
            <li key={item.skill} className="flex flex-col gap-1.5" data-skill={item.skill}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className="text-body font-extrabold">{t(`progress.skills.names.${item.skill}`)}</h3>
                <p className="text-small text-ink-secondary">
                  {item.answered > 0 ? t('progress.skills.right', { right: item.right, answered: item.answered }) : t('progress.skills.none')}
                </p>
              </div>
              <MeterBar value={item.right} total={item.answered} />
            </li>
          ))}
        </ul>
      </Layer>

      <Layer
        title={t('progress.readiness.title')}
        badge={t('home.readiness.label')}
        body={t('home.readiness.generalEnglish', {
          career: t('landing.pathways.careerReadiness.name'),
          general: t('landing.pathways.generalEnglish.name'),
        })}
        data-layer="readiness"
      >
        <ReadinessDetails readiness={level} />
      </Layer>
    </div>
  )
}
