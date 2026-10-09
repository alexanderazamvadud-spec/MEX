import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LANGUAGE } from '../../i18n/index.ts'
import { useLearner } from '../../learner/useLearner.ts'
import Button from '../ui/Button.tsx'
import Card from '../ui/Card.tsx'

type Step = 'idle' | 'confirm' | 'done'

// "Delete my data": removes the learner record and the language choice from this
// device after an in-page confirmation, then returns the app to its initial state.
export default function DeleteDataControl() {
  const { t, i18n } = useTranslation()
  const { reset } = useLearner()
  const [step, setStep] = useState<Step>('idle')
  const [busy, setBusy] = useState(false)
  const headingId = useId()
  const bodyId = useId()
  const confirmRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)

  // Keyboard and screen-reader users follow the flow: focus moves to the
  // confirmation when it appears and to the result once the data is deleted.
  useEffect(() => {
    if (step === 'confirm') confirmRef.current?.focus()
    if (step === 'done') statusRef.current?.focus()
  }, [step])

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    // Switch back to the default language first so the stored choice is not rewritten after reset.
    try {
      await i18n.changeLanguage(DEFAULT_LANGUAGE)
    } catch (error) {
      console.error('MEX could not reset the interface language.', error)
    }
    reset()
    setBusy(false)
    setStep('done')
  }

  return (
    <Card variant="soft" as="section" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-h3">
        {t('settings.deleteData')}
      </h2>
      <p className="text-small text-ink-secondary">{t('settings.privacyNote')}</p>

      {step === 'idle' ? (
        <div>
          <Button variant="destructive" onClick={() => setStep('confirm')}>
            {t('settings.deleteData')}
          </Button>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div
          ref={confirmRef}
          tabIndex={-1}
          role="group"
          aria-labelledby={headingId}
          aria-describedby={bodyId}
          className="flex flex-col gap-3 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          <p id={bodyId} className="text-body">
            {t('settings.deleteConfirmBody')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="destructive" loading={busy} onClick={() => void handleDelete()}>
              {t('settings.deleteConfirmYes')}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setStep('idle')}>
              {t('settings.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {/* The live region exists from the start so the result is announced when it appears. */}
      <p
        ref={statusRef}
        tabIndex={step === 'done' ? -1 : undefined}
        role="status"
        aria-live="polite"
        className={step === 'done' ? 'text-body' : 'sr-only'}
      >
        {step === 'done' ? t('settings.deleted') : null}
      </p>
    </Card>
  )
}
