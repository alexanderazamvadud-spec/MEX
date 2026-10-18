import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { browserSpeech, isStopError, NORMAL_RATE } from '../../learner/speech.ts'
import { useOnDeviceVoice } from '../../learner/useOnDeviceVoice.ts'
import Button from '../ui/Button.tsx'

// "Listen to the question" (MVP-13): the same on-device-only voice rule as listening (MVP-11).
// Nothing is shown when there is no such voice or speaking fails, because the question is
// always on screen as text.
export default function ListenButton({ text, label }: { text: string; label: string }) {
  const { t } = useTranslation()
  const [engine] = useState(browserSpeech)
  const voice = useOnDeviceVoice(engine)
  const [speaking, setSpeaking] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => () => engine?.cancel(), [engine])

  if (!engine || voice.status !== 'ready' || failed) return null

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

  return (
    <div>
      {speaking ? (
        <Button variant="primary" size="md" onClick={stop}>
          {t('listening.stop')}
        </Button>
      ) : (
        <Button variant="secondary" size="md" onClick={listen}>
          {label}
        </Button>
      )}
    </div>
  )
}
