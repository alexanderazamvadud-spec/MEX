import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatTime } from './time.ts'

// A guide timer for speaking practice (MVP-12). It never blocks anything. It counts down
// from `seconds` while `running`, restarting from the top each time it starts, and calls
// onDone at zero. Screen readers hear only "Time's up", not every second.
export default function Countdown({ seconds, running, onDone }: { seconds: number; running: boolean; onDone: () => void }) {
  const { t } = useTranslation()
  const [remaining, setRemaining] = useState(seconds)
  const [finished, setFinished] = useState(false)
  const [wasRunning, setWasRunning] = useState(running)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Restart from the top whenever the timer starts.
  if (running !== wasRunning) {
    setWasRunning(running)
    if (running) {
      setRemaining(seconds)
      setFinished(false)
    }
  }

  useEffect(() => {
    if (!running) return
    const endsAt = Date.now() + seconds * 1000
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(timer)
        setFinished(true)
        onDoneRef.current()
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [running, seconds])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span role="timer" aria-live="off" className="text-h2 tabular-nums" data-timer="true">
        {formatTime(remaining)}
      </span>
      <span role="status" className="text-body font-bold text-primary">
        {finished ? t('speaking.timeUp') : null}
      </span>
    </div>
  )
}
