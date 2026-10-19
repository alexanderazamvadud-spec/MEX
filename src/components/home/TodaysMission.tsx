import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { canOpen, isPlaceholder, type ContentPack } from '../../content/index.ts'
import { totalMinutes, type MissionItem } from '../../learner/mission.ts'
import HomeBlock from './HomeBlock.tsx'

// Block 1: up to two recommended activities, their total time, and "Why this mission?"
// with one sentence per item naming the fixed rule that chose it (MVP-16).
// Each activity links to itself when it has a player, otherwise to its unit overview.
// There is no Start button.
export default function TodaysMission({ pack, mission }: { pack: ContentPack | null; mission: MissionItem[] }) {
  const { t } = useTranslation()
  if (!pack) return <HomeBlock title={t('home.mission.title')} busy data-block="mission" />

  function why({ activity, reason }: MissionItem): string {
    switch (reason.rule) {
      case 'next':
        return t('home.mission.whyNext', { activity: activity.title, unit: reason.unit })
      case 'nextUnit':
        return t('home.mission.whyNextUnit', { activity: activity.title, finished: reason.finished, unit: reason.unit })
      case 'interview':
        return t('home.mission.whyInterview', { activity: activity.title })
      case 'repeat':
        return t('home.mission.whyRepeat', { activity: activity.title, right: reason.right, total: reason.total })
    }
  }

  return (
    <HomeBlock
      title={t('home.mission.title')}
      badge={isPlaceholder(pack.content_status) ? t('home.sampleContent') : undefined}
      data-block="mission"
    >
      {mission.length > 0 ? (
        <>
          <ol className="flex flex-col gap-2">
            {mission.map((item) => (
              <li key={item.activity.id} data-rule={item.reason.rule}>
                <Link
                  to={`/learn/${pack.pathway}/${item.unitId}${canOpen(item.activity) ? `/${item.activity.id}` : ''}`}
                  className="flex min-h-11 items-center rounded-panel bg-surface px-4 py-3 text-body font-bold text-ink no-underline hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
                >
                  {item.activity.title}
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-small text-ink-secondary">{t('home.mission.total', { n: totalMinutes(mission) })}</p>
          {mission.some((item) => !canOpen(item.activity)) ? (
            <p className="text-small text-ink-secondary">{t('home.mission.noPlayer')}</p>
          ) : null}
        </>
      ) : (
        <p className="text-body">{t('home.mission.unitFinished')}</p>
      )}
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-pill text-body font-bold text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">
          {t('home.mission.why')}
        </summary>
        <div className="flex flex-col gap-2 pt-1">
          {mission.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-body" data-why>
              {mission.map((item) => (
                <li key={item.activity.id}>{why(item)}</li>
              ))}
            </ul>
          ) : null}
          <p className="text-body text-ink-secondary">{t('home.mission.whyBody')}</p>
        </div>
      </details>
    </HomeBlock>
  )
}
