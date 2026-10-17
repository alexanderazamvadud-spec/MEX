import { useTranslation } from 'react-i18next'
import { PATHWAY_KEYS } from '../components/learn/text.ts'
import LinkCard from '../components/learn/LinkCard.tsx'
import Badge from '../components/ui/Badge.tsx'
import { PATHWAY_IDS } from '../content/index.ts'
import { useLearner } from '../learner/useLearner.ts'

// Pathways hub (MVP-08, Scope v2 screen S5) at #/learn. Both pathways use the same card,
// size, heading level and order as the landing page; the only difference is the
// "Your current pathway" label on the active one. Opening a pathway does not switch to it.
export default function LearnPage() {
  const { t } = useTranslation()
  const { record } = useLearner()
  const active = record.profile?.pathway ?? null

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.learn')}</h1>
      <p className="text-body text-ink-secondary">{t('learn.intro')}</p>
      <ul className="flex flex-col gap-4">
        {PATHWAY_IDS.map((pathway) => {
          const key = PATHWAY_KEYS[pathway]
          return (
            <li key={pathway} data-pathway={pathway}>
              <LinkCard to={`/learn/${pathway}`} variant="sky">
                {pathway === active ? (
                  <span>
                    <Badge variant="surface">{t('learn.current')}</Badge>
                  </span>
                ) : null}
                <h2 className="text-h3 text-primary">{t(`landing.pathways.${key}.name`)}</h2>
                <p className="text-body">{t(`landing.pathways.${key}.body`)}</p>
              </LinkCard>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
