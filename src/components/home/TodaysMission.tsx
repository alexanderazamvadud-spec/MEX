import { useTranslation } from 'react-i18next'
import { isPlaceholder, type Activity, type ContentPack } from '../../content/index.ts'
import HomeBlock from './HomeBlock.tsx'

// Block 1: up to two recommended activities and a "Why this mission?" note.
// There is no activity player yet, so activities are names only, with no Start button.
export default function TodaysMission({ pack, mission }: { pack: ContentPack | null; mission: Activity[] }) {
  const { t } = useTranslation()
  if (!pack) return <HomeBlock title={t('home.mission.title')} busy data-block="mission" />

  return (
    <HomeBlock
      title={t('home.mission.title')}
      badge={isPlaceholder(pack.content_status) ? t('home.sampleContent') : undefined}
      data-block="mission"
    >
      {mission.length > 0 ? (
        <>
          <ol className="flex flex-col gap-2">
            {mission.map((activity) => (
              <li key={activity.id} className="rounded-panel bg-surface px-4 py-3 text-body font-bold">
                {activity.title}
              </li>
            ))}
          </ol>
          <p className="text-small text-ink-secondary">{t('home.mission.noPlayer')}</p>
        </>
      ) : (
        <p className="text-body">{t('home.mission.unitFinished')}</p>
      )}
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-pill text-body font-bold text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">
          {t('home.mission.why')}
        </summary>
        <p className="pt-1 text-body text-ink-secondary">{t('home.mission.whyBody')}</p>
      </details>
    </HomeBlock>
  )
}
