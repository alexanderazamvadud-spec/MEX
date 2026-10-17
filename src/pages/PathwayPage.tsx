import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import LinkCard from '../components/learn/LinkCard.tsx'
import { PATHWAY_KEYS } from '../components/learn/text.ts'
import Badge, { type BadgeVariant } from '../components/ui/Badge.tsx'
import { isPlaceholder, localized, PATHWAY_IDS, type PathwayId } from '../content/index.ts'
import { usePack } from '../content/usePack.ts'
import { completedActivityIds, unitCompletion, type UnitStatus } from '../learner/progress.ts'
import { useLearner } from '../learner/useLearner.ts'
import NotFoundPage from './NotFoundPage.tsx'

// Pathway overview (MVP-08, Scope v2 screen S6) at #/learn/:pathway: the pathway's units
// with curriculum completion from saved data. The content's level is not shown, so it is
// never mistaken for the learner's self-reported level. Browsing never switches pathway.

const STATUS_BADGE: Record<UnitStatus, BadgeVariant> = {
  notStarted: 'surface',
  inProgress: 'sky',
  completed: 'success',
}

function isPathwayId(value: string | undefined): value is PathwayId {
  return PATHWAY_IDS.includes(value as PathwayId)
}

export default function PathwayPage() {
  const { pathway } = useParams()
  const valid = isPathwayId(pathway)
  const pack = usePack(valid ? pathway : null)
  const { t, i18n } = useTranslation()
  const { record } = useLearner()

  if (!valid) return <NotFoundPage />

  const done = completedActivityIds(pathway, record.completions)
  const name = t(`landing.pathways.${PATHWAY_KEYS[pathway]}.name`)

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/learn" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 empty:hidden">
          {record.profile?.pathway === pathway ? <Badge variant="sky">{t('learn.current')}</Badge> : null}
          {pack && isPlaceholder(pack.content_status) ? <Badge variant="sky">{t('home.sampleContent')}</Badge> : null}
        </div>
        <h1 className="text-h1">{name}</h1>
        {pack ? <p className="text-body text-ink-secondary">{localized(pack.description, i18n.resolvedLanguage)}</p> : null}
      </div>

      <section aria-labelledby="pathway-units" aria-busy={!pack || undefined} className="flex flex-col gap-3">
        <h2 id="pathway-units" className="text-h2">
          {t('learn.units')}
        </h2>
        {pack ? (
          <ol className="flex flex-col gap-3">
            {pack.units.map((unit, index) => {
              const progress = unitCompletion(unit, done)
              return (
                <li key={unit.id} data-unit={unit.id}>
                  <LinkCard to={`/learn/${pathway}/${unit.id}`}>
                    <span>
                      <Badge variant={STATUS_BADGE[progress.status]}>{t(`learn.status.${progress.status}`)}</Badge>
                    </span>
                    <h3 className="text-h3">{t('home.pathway.unit', { n: index + 1, name: unit.title })}</h3>
                    <p className="text-body text-ink-secondary">{localized(unit.summary, i18n.resolvedLanguage)}</p>
                    <p className="text-small text-ink-secondary">
                      {t('home.pathway.count', { done: progress.done, total: progress.total })}
                    </p>
                  </LinkCard>
                </li>
              )
            })}
          </ol>
        ) : null}
      </section>
    </div>
  )
}
