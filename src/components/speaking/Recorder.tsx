import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecordingEngine, RecordingSession } from '../../learner/recording.ts'
import Button from '../ui/Button.tsx'
import { formatTime } from './time.ts'

// Optional on-device recording with playback (MVP-12, decision Q7). The microphone is asked
// for only on "Record". The clip is held as an in-memory object URL for the audio player and
// is released on "Record again" and when the screen closes; it is never stored or sent.

type State =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'recording'; startedAt: number }
  | { status: 'clip'; url: string }
  | { status: 'unavailable' }

export default function Recorder({ engine }: { engine: RecordingEngine }) {
  const { t } = useTranslation()
  const [state, setState] = useState<State>({ status: 'idle' })
  const [elapsed, setElapsed] = useState(0)
  const session = useRef<RecordingSession | null>(null)
  const url = useRef<string | null>(null)
  const alive = useRef(true)

  function discardClip() {
    if (url.current) URL.revokeObjectURL(url.current)
    url.current = null
  }

  // Leaving the screen stops any recording and deletes the clip.
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      session.current?.stop()
      session.current = null
      discardClip()
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'recording') return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - state.startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [state])

  async function record() {
    discardClip()
    setState({ status: 'requesting' })
    const started = await engine.start({
      onClip: (clip) => {
        session.current = null
        if (!alive.current) return
        discardClip()
        url.current = URL.createObjectURL(clip)
        setState({ status: 'clip', url: url.current })
      },
      onUnavailable: () => {
        session.current = null
        if (alive.current) setState({ status: 'unavailable' })
      },
    })
    if (!alive.current) {
      started?.stop()
      return
    }
    if (started) {
      session.current = started
      setElapsed(0)
      setState({ status: 'recording', startedAt: Date.now() })
    }
  }

  function stop() {
    session.current?.stop()
  }

  return (
    <div className="flex flex-col gap-3" data-recorder={state.status}>
      {state.status === 'unavailable' ? (
        <p role="status" className="rounded-panel bg-info-tint px-4 py-3 text-body text-info-text">
          {t('speaking.unavailable')}
        </p>
      ) : (
        <p className="text-small text-ink-secondary">{t('speaking.recordingNote')}</p>
      )}

      {state.status === 'recording' ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-body font-bold text-error-text">
            <span aria-hidden="true" className="size-3 rounded-pill bg-error-border motion-safe:animate-pulse" />
            {t('speaking.recording')} {formatTime(elapsed)}
          </span>
          <Button variant="primary" size="md" onClick={stop}>
            {t('speaking.stop')}
          </Button>
        </div>
      ) : state.status === 'clip' ? (
        <div className="flex flex-col gap-3">
          <audio controls src={state.url} aria-label={t('speaking.recording')} className="w-full" />
          <div>
            <Button variant="secondary" size="md" onClick={record}>
              {t('speaking.recordAgain')}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="primary" size="md" onClick={record} loading={state.status === 'requesting'}>
            {t('speaking.record')}
          </Button>
        </div>
      )}
    </div>
  )
}
