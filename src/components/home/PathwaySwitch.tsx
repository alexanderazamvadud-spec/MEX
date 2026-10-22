import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PATHWAY_IDS, type PathwayId } from '../../content/index.ts'
import Button from '../ui/Button.tsx'
import { PATHWAY_KEYS } from '../learn/text.ts'

// "Switch pathway" with an in-page confirmation, shared by Home and Settings (MVP-17).
// The button is tertiary and pulled left so its text lines up with the card text.
export default function PathwaySwitch({
  pathway,
  onSwitch,
  label,
}: {
  pathway: PathwayId
  onSwitch: (to: PathwayId) => void
  /** The button text; defaults to "Switch pathway". */
  label?: string
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
  // switch button when it closes.
  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
    else if (restoreFocus.current) switchRef.current?.querySelector('button')?.focus()
    restoreFocus.current = false
  }, [confirming])

  function close() {
    restoreFocus.current = true
    setConfirming(false)
  }

  if (confirming) {
    return (
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
    )
  }

  return (
    <div ref={switchRef} className="-ml-4">
      <Button variant="tertiary" size="sm" onClick={() => setConfirming(true)}>
        {label ?? t('home.pathway.switch')}
      </Button>
    </div>
  )
}
