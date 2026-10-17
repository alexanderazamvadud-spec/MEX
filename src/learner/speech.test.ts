import { describe, expect, it } from 'vitest'
import { isStopError, pickVoice, type VoiceLike } from './speech.ts'

const voice = (name: string, lang: string, localService: boolean): VoiceLike => ({ name, lang, localService })

describe('pickVoice', () => {
  it('never chooses an online voice, even when it is the only English one', () => {
    expect(pickVoice([voice('Google UK English', 'en-GB', false), voice('Milena', 'ru-RU', true)])).toBeNull()
  })

  it('prefers on-device British, then American, then any other English', () => {
    const voices = [
      voice('Online GB', 'en-GB', false),
      voice('Karen', 'en-AU', true),
      voice('Samantha', 'en-US', true),
      voice('Daniel', 'en_GB', true),
    ]
    expect(pickVoice(voices)?.name).toBe('Daniel')
    expect(pickVoice(voices.slice(0, 3))?.name).toBe('Samantha')
    expect(pickVoice(voices.slice(0, 2))?.name).toBe('Karen')
  })

  it('returns null with no voices at all', () => {
    expect(pickVoice([])).toBeNull()
  })
})

describe('isStopError', () => {
  it('treats only MEX stopping speech as not a failure', () => {
    expect(isStopError('interrupted')).toBe(true)
    expect(isStopError('canceled')).toBe(true)
    expect(isStopError('synthesis-failed')).toBe(false)
    expect(isStopError('voice-unavailable')).toBe(false)
  })
})
