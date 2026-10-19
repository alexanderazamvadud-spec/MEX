import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../components/learn/text.ts'
import Badge from '../components/ui/Badge.tsx'
import { canOpen, isPlaceholder, localized, PATHWAY_IDS, type Activity, type PathwayId } from '../content/index.ts'
import { usePack } from '../content/usePack.ts'
import { fixedRuleProvider, homeInput } from '../learner/home.ts'
import { completedActivityIds } from '../learner/progress.ts'
import { useLearner } from '../learner/useLearner.ts'
import NotFoundPage from './NotFoundPage.tsx'

// Unit overview (MVP-08, Scope v2 screen S7) at #/learn/:pathway/:unit: the unit's
// activities with type, estimated time and completion. An activity whose type has no
// player yet is not a link and carries "Opens soon"; once its player exists (see
// PLAYABLE_ACTIVITY_TYPES) the label goes and the row links to the activity.

function isPathwayId(value: string | undefined): value is PathwayId {
  return PATHWAY_IDS.includes(value as PathwayId)
}

function ActivityRow({
  activity,
  href,
  completed,
  inMission,
}: {
  activity: Activity
  href: string
  completed: boolean
  inMission: boolean
}) {
  const { t } = useTranslation()
  const open = canOpen(activity)
  const body = (
    <>
      <span className="text-body font-bold">{activity.title}</span>
      <span className="text-small text-ink-secondary">
        {t(`learn.types.${ACTIVITY_TYPE_KEYS[activity.type]}`)} · {t('learn.minutes', { n: activity.estimatedMinutes })}
      </span>
      <span className="flex flex-wrap gap-2 empty:hidden">
        {completed ? <Badge variant="success">{t('learn.done')}</Badge> : null}
        {inMission ? <Badge variant="sky">{t('learn.mission')}</Badge> : null}
        {!open ? <Badge variant="surface">{t('learn.opensSoon')}</Badge> : null}
      </span>
    </>
  )
  const classes = 'flex flex-col gap-1.5 rounded-card bg-surface-soft p-4'
  return (
    <li data-activity={activity.id}>
      {open ? (
        <Link
          to={href}
          className={`${classes} font-normal text-ink no-underline hover:bg-surface-soft-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)`}
        >
          {body}
        </Link>
      ) : (
        <div className={classes}>{body}</div>
      )}
    </li>
  )
}

export default function UnitPage() {
  const { pathway, unit: unitId } = useParams()
  const valid = isPathwayId(pathway)
  const pack = usePack(valid ? pathway : null)
  const { t, i18n } = useTranslation()
  const { record } = useLearner()

  if (!valid) return <NotFoundPage />
  const index = pack ? pack.units.findIndex((item) => item.id === unitId) : -1
  if (pack && index === -1) return <NotFoundPage />
  const unit = pack ? pack.units[index] : null

  const done = completedActivityIds(pathway, record.completions)
  // Today's mission belongs to the active pathway only.
  const mission =
    pack && record.profile?.pathway === pathway
      ? new Set(fixedRuleProvider(homeInput(pack, record)).mission.map((item) => item.activity.id))
      : new Set<string>()

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={`/learn/${pathway}`} />
      <div className="flex flex-col gap-2" aria-busy={!unit || undefined}>
        {pack && isPlaceholder(pack.content_status) ? (
          <span>
            <Badge variant="sky">{t('home.sampleContent')}</Badge>
          </span>
        ) : null}
        {unit ? (
          <>
            <h1 className="text-h1">{t('home.pathway.unit', { n: index + 1, name: unit.title })}</h1>
            <p className="text-body text-ink-secondary">{localized(unit.summary, i18n.resolvedLanguage)}</p>
          </>
        ) : null}
      </div>

      {unit ? (
        <section aria-labelledby="unit-activities" className="flex flex-col gap-3">
          <h2 id="unit-activities" className="text-h2">
            {t('learn.activities')}
          </h2>
          <ol className="flex flex-col gap-3">
            {unit.activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                href={`/learn/${pathway}/${unit.id}/${activity.id}`}
                completed={done.has(activity.id)}
                inMission={mission.has(activity.id)}
              />
            ))}
          </ol>
          {unit.activities.some((activity) => !canOpen(activity)) ? (
            <p className="text-small text-ink-secondary">{t('home.mission.noPlayer')}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
