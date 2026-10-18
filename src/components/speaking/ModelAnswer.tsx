import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { browserSpeech, isStopError, NORMAL_RATE } from '../../learner/speech.ts'
import { useOnDeviceVoice } from '../../learner/useOnDeviceVoice.ts'
import Button from '../ui/Button.tsx'

// The model answer (MVP-12): hidden until asked for, then shown as English text. "Listen to
// the model answer" uses the same on-device-only voice rule as listening (MVP-11) and is not
// shown when there is no such voice or speaking fails.
export default function ModelAnswer({ text }: { text: string }) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)
  const [engine] = useState(browserSpeech)
  const voice = useOnDeviceVoice(engine)
  const [speaking, setSpeaking] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => () => engine?.cancel(), [engine])

  function listen() {
    if (!engine || voice.status !== 'ready') return
    setSpeaking(true)
    engine.speak(text, {
      voice: voice.voice,
      rate: NORMAL_RATE,
      onEnd: () => setSpeaking(false),
      onError: (error) => {
        setSpeaking(false)
        if (!isStopError(error)) {
          engine.cancel()
          setFailed(true)
        }
      },
    })
  }

  function stop() {
    engine?.cancel()
    setSpeaking(false)
  }

  if (!shown) {
    return (
      <div>
        <Button variant="secondary" size="md" onClick={() => setShown(true)}>
          {t('speaking.showModel')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p lang="en" className="rounded-card bg-surface-soft p-5 text-body" data-model="true">
        {text}
      </p>
      {voice.status === 'ready' && !failed ? (
        <div>
          {speaking ? (
            <Button variant="primary" size="md" onClick={stop}>
              {t('listening.stop')}
            </Button>
          ) : (
            <Button variant="secondary" size="md" onClick={listen}>
              {t('speaking.listenModel')}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
