import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isPlaceholder, PATHWAY_IDS, type ContentPack, type PathwayId } from '../../content/index.ts'
import type { UnitProgress } from '../../learner/home.ts'
import Button from '../ui/Button.tsx'
import HomeBlock from './HomeBlock.tsx'

// Translation key segment for each pathway; the names are the approved MVP-06 texts.
const PATHWAY_KEYS: Record<PathwayId, string> = {
  'general-english': 'generalEnglish',
  'career-readiness': 'careerReadiness',
}

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
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)
  const switchRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(false)
  const bodyId = useId()
  const other = PATHWAY_IDS.find((item) => item !== pathway) ?? pathway
  const otherName = t(`landing.pathways.${PATHWAY_KEYS[other]}.name`)

  // Focus follows the flow: into the confirmation when it opens, back to the
  // "Switch pathway" button when it closes.
  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
    else if (restoreFocus.current) switchRef.current?.querySelector('button')?.focus()
    restoreFocus.current = false
  }, [confirming])

  function close() {
    restoreFocus.current = true
    setConfirming(false)
  }

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

      {confirming ? (
        <div
          ref={confirmRef}
          tabIndex={-1}
          role="group"
          aria-labelledby={bodyId}
          className="flex flex-col gap-3 rounded-panel bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          <p id={bodyId} className="text-body">
            {t('home.pathway.confirm', { pathway: otherName })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onSwitch(other)
                close()
              }}
            >
              {t('home.pathway.confirmYes')}
            </Button>
            <Button variant="secondary" size="sm" onClick={close}>
              {t('home.pathway.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div ref={switchRef} className="-ml-4">
          <Button variant="tertiary" size="sm" onClick={() => setConfirming(true)}>
            {t('home.pathway.switch')}
          </Button>
        </div>
      )}
    </HomeBlock>
  )
}
