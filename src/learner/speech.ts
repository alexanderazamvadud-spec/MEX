// Listening playback (MVP-11, decision Q5): the browser's built-in text-to-speech with
// on-device voices only, so the transcript is never sent anywhere. A voice counts as
// on-device when the browser reports `localService: true`; MEX cannot check that flag
// itself. The chosen voice is always set on the utterance, so the browser's default voice,
// which may be an online one, is never used. Everything goes through SpeechEngine so tests
// can supply a fake.

/** The parts of a SpeechSynthesisVoice that MEX uses. */
export interface VoiceLike {
  name: string
  lang: string
  localService: boolean
}

export interface SpeakOptions {
  voice: VoiceLike
  rate: number
  onEnd: () => void
  onError: (error: string) => void
}

export interface SpeechEngine {
  getVoices(): VoiceLike[]
  /** Calls the listener when the browser's voice list changes; returns an unsubscribe. */
  onVoicesChanged(listener: () => void): () => void
  speak(text: string, options: SpeakOptions): void
  cancel(): void
}

export const NORMAL_RATE = 1
export const SLOW_RATE = 0.8
/** How long to wait for voices that some browsers load after the page. */
export const VOICE_WAIT_MS = 1500

/** Errors caused by MEX stopping speech itself, which are not failures. */
const STOP_ERRORS = new Set(['interrupted', 'canceled'])

export function isStopError(error: string): boolean {
  return STOP_ERRORS.has(error)
}

/**
 * The on-device English voice to use, or null. Prefers British English, then American,
 * then any other English; online voices are never chosen.
 */
export function pickVoice(voices: readonly VoiceLike[]): VoiceLike | null {
  const english = voices.filter((voice) => voice.localService && voice.lang.toLowerCase().replace('_', '-').startsWith('en'))
  const rank = (voice: VoiceLike) => {
    const lang = voice.lang.toLowerCase().replace('_', '-')
    if (lang === 'en-gb') return 0
    if (lang === 'en-us') return 1
    return 2
  }
  return [...english].sort((a, b) => rank(a) - rank(b))[0] ?? null
}

/** The browser's speech engine, or null when the browser has no text-to-speech. */
export function browserSpeech(): SpeechEngine | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return null
  }
  const synth = window.speechSynthesis
  return {
    getVoices: () => synth.getVoices(),
    onVoicesChanged(listener) {
      synth.addEventListener('voiceschanged', listener)
      return () => synth.removeEventListener('voiceschanged', listener)
    },
    speak(text, { voice, rate, onEnd, onError }) {
      const match = synth.getVoices().find((item) => item.name === voice.name && item.lang === voice.lang && item.localService)
      if (!match) {
        onError('voice-unavailable')
        return
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = match
        utterance.lang = match.lang
        utterance.rate = rate
        utterance.onend = () => onEnd()
        utterance.onerror = (event) => onError(event.error)
        synth.cancel()
        synth.speak(utterance)
      } catch {
        onError('synthesis-failed')
      }
    },
    cancel: () => synth.cancel(),
  }
}
