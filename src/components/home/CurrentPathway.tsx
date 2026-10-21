import { useTranslation } from 'react-i18next'
import { isPlaceholder, type ContentPack, type PathwayId } from '../../content/index.ts'
import type { UnitProgress } from '../../learner/home.ts'
import HomeBlock from './HomeBlock.tsx'
import PathwaySwitch from './PathwaySwitch.tsx'
import { PATHWAY_KEYS } from '../learn/text.ts'

// Block 3: the active pathway (one at a time, decision Q8), its current unit and the
// curriculum-completion count, plus "Switch pathway" with an in-page confirmation.
export default function CurrentPathway({
  pathway,
  pack,
  progress,
  onSwitch,
}: {
  pathway: PathwayId
  pack: ContentPack | null
  progress: UnitProgress | null
  onSwitch: (to: PathwayId) => void
}) {
  const { t } = useTranslation()
  return (
    <HomeBlock
      title={t('home.pathway.title')}
      badge={pack && isPlaceholder(pack.content_status) ? t('home.sampleContent') : undefined}
      busy={!pack}
      data-block="pathway"
    >
      <p className="text-h3 text-primary">{t(`landing.pathways.${PATHWAY_KEYS[pathway]}.name`)}</p>
      {progress ? (
        <>
          <p className="text-body">{t('home.pathway.unit', { n: progress.number, name: progress.unit.title })}</p>
          <p className="text-body text-ink-secondary">
            {t('home.pathway.count', { done: progress.done, total: progress.total })}
          </p>
        </>
      ) : null}
      <PathwaySwitch pathway={pathway} onSwitch={onSwitch} />
    </HomeBlock>
  )
}
