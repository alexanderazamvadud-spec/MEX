import { useEffect, useState } from 'react'
import { pickVoice, VOICE_WAIT_MS, type SpeechEngine, type VoiceLike } from './speech.ts'

// Finds the on-device English voice (MVP-11, decision Q5), waiting briefly for voices that
// some browsers load after the page. Used by listening and by the speaking model answer.

export type VoiceState = { status: 'checking' } | { status: 'ready'; voice: VoiceLike } | { status: 'none' }

export function useOnDeviceVoice(engine: SpeechEngine | null): VoiceState {
  const [state, setState] = useState<VoiceState>(() => {
    if (!engine) return { status: 'none' }
    const voices = engine.getVoices()
    if (voices.length === 0) return { status: 'checking' }
    const voice = pickVoice(voices)
    return voice ? { status: 'ready', voice } : { status: 'none' }
  })

  useEffect(() => {
    if (!engine || state.status !== 'checking') return
    function decide() {
      const voice = pickVoice(engine!.getVoices())
      setState(voice ? { status: 'ready', voice } : { status: 'none' })
    }
    const unsubscribe = engine.onVoicesChanged(() => {
      if (engine.getVoices().length > 0) decide()
    })
    const timer = window.setTimeout(decide, VOICE_WAIT_MS)
    return () => {
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [engine, state.status])

  return state
}
