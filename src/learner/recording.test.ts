// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserRecording, MAX_RECORDING_MS } from './recording.ts'

// jsdom has no microphone, so these fakes stand in for getUserMedia and MediaRecorder.
class FakeRecorder {
  static last: FakeRecorder | null = null
  state: 'inactive' | 'recording' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    FakeRecorder.last = this
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio']) })
    this.onstop?.()
  }
}

function microphone(result: 'allow' | 'deny') {
  const track = { stop: vi.fn() }
  const getUserMedia = vi.fn(async () => {
    if (result === 'deny') throw new DOMException('denied', 'NotAllowedError')
    return { getTracks: () => [track] }
  })
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  return { track, getUserMedia }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  FakeRecorder.last = null
})

describe('browserRecording', () => {
  it('records into memory and releases the microphone on stop', async () => {
    const { track, getUserMedia } = microphone('allow')
    const onClip = vi.fn()
    const onUnavailable = vi.fn()
    const session = await browserRecording().start({ onClip, onUnavailable })
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(track.stop).not.toHaveBeenCalled()
    session!.stop()
    expect(track.stop).toHaveBeenCalled()
    expect(onClip).toHaveBeenCalledTimes(1)
    expect(onClip.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('stops by itself at the time limit', async () => {
    vi.useFakeTimers()
    microphone('allow')
    const onClip = vi.fn()
    await browserRecording().start({ onClip, onUnavailable: vi.fn() })
    vi.advanceTimersByTime(MAX_RECORDING_MS)
    expect(onClip).toHaveBeenCalledTimes(1)
    expect(FakeRecorder.last!.state).toBe('inactive')
  })

  it('reports unavailable when the learner refuses the microphone', async () => {
    microphone('deny')
    const onUnavailable = vi.fn()
    expect(await browserRecording().start({ onClip: vi.fn(), onUnavailable })).toBeNull()
    expect(onUnavailable).toHaveBeenCalledTimes(1)
  })

  it('reports unavailable when the browser cannot record', async () => {
    microphone('allow')
    vi.stubGlobal('MediaRecorder', undefined)
    const onUnavailable = vi.fn()
    expect(await browserRecording().start({ onClip: vi.fn(), onUnavailable })).toBeNull()
    expect(onUnavailable).toHaveBeenCalledTimes(1)
  })
})
