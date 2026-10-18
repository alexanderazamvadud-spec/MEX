// On-device voice recording for speaking practice (MVP-12, decision Q7). The microphone is
// requested only when the learner taps Record. The recording is kept as an in-memory Blob
// for playback and is never written to browser storage, added to the learner record or sent
// anywhere; the screen discards it when the learner leaves, records again or finishes.
// The microphone is released as soon as recording stops. Everything goes through
// RecordingEngine so tests can supply a fake.

/** Recording stops by itself after this long, to keep memory use small on phones. */
export const MAX_RECORDING_MS = 2 * 60 * 1000

export interface RecordingSession {
  /** Stops recording; onClip follows with the recording. */
  stop(): void
}

export interface RecordingHandlers {
  onClip: (clip: Blob) => void
  /** No microphone, permission refused, or recording not supported. */
  onUnavailable: () => void
}

export interface RecordingEngine {
  /** Asks for the microphone and starts recording; resolves to null when unavailable. */
  start(handlers: RecordingHandlers): Promise<RecordingSession | null>
}

export function browserRecording(): RecordingEngine {
  return {
    async start({ onClip, onUnavailable }) {
      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        onUnavailable()
        return null
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        onUnavailable()
        return null
      }
      const release = () => stream.getTracks().forEach((track) => track.stop())
      let recorder: MediaRecorder
      try {
        recorder = new MediaRecorder(stream)
      } catch {
        release()
        onUnavailable()
        return null
      }
      const chunks: Blob[] = []
      const limit = window.setTimeout(() => stop(), MAX_RECORDING_MS)
      function stop() {
        window.clearTimeout(limit)
        if (recorder.state !== 'inactive') recorder.stop()
      }
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        release()
        onClip(new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' }))
      }
      recorder.onerror = () => {
        window.clearTimeout(limit)
        release()
        onUnavailable()
      }
      recorder.start()
      return { stop }
    },
  }
}
