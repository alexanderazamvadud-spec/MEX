// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { SpeakingItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import type { RecordingEngine, RecordingHandlers } from '../learner/recording.ts'
import type { SpeechEngine } from '../learner/speech.ts'
import { renderAt, storeWith } from './learnTestUtils.tsx'

// The test browser has no microphone or speech, so fakes stand in for both.
interface FakeRecorder extends RecordingEngine {
  starts: number
  stops: number
  handlers: RecordingHandlers | null
  unavailable: boolean
}

let recorder: FakeRecorder
let speech: SpeechEngine | null = null

function fakeRecorder(unavailable = false): FakeRecorder {
  const engine: FakeRecorder = {
    starts: 0,
    stops: 0,
    handlers: null,
    unavailable,
    async start(handlers) {
      engine.starts += 1
      engine.handlers = handlers
      if (engine.unavailable) {
        handlers.onUnavailable()
        return null
      }
      return {
        stop() {
          engine.stops += 1
          handlers.onClip(new Blob(['audio'], { type: 'audio/webm' }))
        },
      }
    },
  }
  return engine
}

vi.mock('../learner/recording.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learner/recording.ts')>()
  return { ...actual, browserRecording: () => recorder }
})
vi.mock('../learner/speech.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learner/speech.ts')>()
  return { ...actual, browserSpeech: () => speech }
})

const text = en.speaking
let urls: string[]
let revoked: string[]

async function speaking(pathway: 'general-english' | 'career-readiness' = 'general-english') {
  const pack = await loadPack(pathway)
  const unit = pack.units[0]
  const activity = unit.activities.find((item) => item.type === 'speaking') as Activity
  const item = activity.items[0] as SpeakingItem
  return { unit, activity, item, path: `/learn/${pathway}/${unit.id}/${activity.id}` }
}

beforeEach(async () => {
  recorder = fakeRecorder()
  speech = null
  urls = []
  revoked = []
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${urls.length + 1}`
    urls.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('SpeakingPage', () => {
  it('shows the five steps, labelled as a self-assessment, with English content', async () => {
    const { activity, item, path } = await speaking()
    renderAt(path, storeWith('general-english'))
    expect(await screen.findByRole('heading', { level: 1, name: activity.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText(en.home.readiness.label)).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      text.task,
      text.prepare,
      text.speak,
      text.model,
      text.check,
    ])
    expect(screen.getByText(item.prompt.en).getAttribute('lang')).toBe('en')
    for (const hint of item.preparationHints) expect(screen.getByText(hint)).toBeTruthy()
    expect(screen.getByText(text.selfNote)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/assessed|demonstrated/i)
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('asks for the microphone only on Record, plays the clip back, and replaces it on Record again', async () => {
    const { path } = await speaking()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText(text.recordingNote)
    fireEvent.click(screen.getByRole('button', { name: text.startPreparing }))
    fireEvent.click(screen.getByRole('button', { name: text.startSpeaking }))
    fireEvent.click(screen.getByRole('button', { name: text.showModel }))
    expect(recorder.starts).toBe(0)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: text.record })))
    expect(recorder.starts).toBe(1)
    expect(screen.getByText(`${text.recording} 0:00`)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: text.stop }))
    const audio = document.querySelector('audio')!
    expect(audio.getAttribute('src')).toBe('blob:test/1')

    await act(async () => fireEvent.click(screen.getByRole('button', { name: text.recordAgain })))
    expect(revoked).toEqual(['blob:test/1'])
    expect(recorder.starts).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: text.stop }))
    expect(document.querySelector('audio')!.getAttribute('src')).toBe('blob:test/2')

    // The clip is never saved.
    expect(JSON.stringify(store.read())).not.toMatch(/blob:|audio/)
    expect(JSON.stringify({ ...window.localStorage })).not.toMatch(/blob:|audio/)
  })

  it('deletes the clip and stops recording when the learner leaves', async () => {
    const { path } = await speaking()
    renderAt(path, storeWith('general-english'))
    const recordButton = await screen.findByRole('button', { name: text.record })
    await act(async () => fireEvent.click(recordButton))
    fireEvent.click(screen.getByRole('button', { name: text.stop }))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: text.recordAgain })))
    // Leave while the second recording is still running.
    fireEvent.click(screen.getByRole('link', { name: en.learn.back }))
    await screen.findByText(en.learn.activities)
    expect(recorder.stops).toBe(2)
    expect(revoked).toEqual(['blob:test/1'])
    expect(urls).toEqual(['blob:test/1'])
  })

  it('shows the honest note when recording is unavailable, and the activity still works', async () => {
    recorder = fakeRecorder(true)
    const { path } = await speaking()
    const store = storeWith('general-english')
    renderAt(path, store)
    const recordButton = await screen.findByRole('button', { name: text.record })
    await act(async () => fireEvent.click(recordButton))
    const note = screen.getByText(text.unavailable)
    expect(note.getAttribute('role')).toBe('status')
    // A second tap asks again.
    await act(async () => fireEvent.click(screen.getByRole('button', { name: text.record })))
    expect(recorder.starts).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    expect(store.read().completions).toHaveLength(1)
  })

  it('counts the timers down as a guide, says when time is up, and lets the learner skip', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false, toFake: ['setInterval', 'clearInterval', 'Date'] })
    const { path } = await speaking()
    renderAt(path, storeWith('general-english'))
    await act(() => vi.advanceTimersByTimeAsync(0))
    const prepare = within(document.querySelector<HTMLElement>('[data-step="prepare"]')!)
    const speak = within(document.querySelector<HTMLElement>('[data-step="speak"]')!)
    expect(prepare.getByRole('timer').textContent).toBe('1:00')
    fireEvent.click(prepare.getByRole('button', { name: text.startPreparing }))
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(prepare.getByRole('timer').textContent).toBe('0:50')
    fireEvent.click(prepare.getByRole('button', { name: text.ready }))
    expect(prepare.getByRole('button', { name: text.startPreparing })).toBeTruthy()
    expect(prepare.queryByText(text.timeUp)).toBeNull()

    fireEvent.click(speak.getByRole('button', { name: text.startSpeaking }))
    expect(speak.getByRole('timer').textContent).toBe('0:30')
    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(speak.getByRole('timer').textContent).toBe('0:00')
    expect(speak.getByText(text.timeUp)).toBeTruthy()
    // Starting the speaking timer again restarts it.
    fireEvent.click(speak.getByRole('button', { name: text.startSpeaking }))
    expect(speak.getByRole('timer').textContent).toBe('0:30')
    expect(speak.queryByText(text.timeUp)).toBeNull()
  })

  it('shows the model answer on request, with Listen only when an on-device English voice exists', async () => {
    const { item, path } = await speaking()
    renderAt(path, storeWith('general-english'))
    expect(screen.queryByText(item.modelAnswer)).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: text.showModel }))
    expect(screen.getByText(item.modelAnswer).getAttribute('lang')).toBe('en')
    expect(screen.queryByRole('button', { name: text.listenModel })).toBeNull()
    cleanup()

    const spoken: string[] = []
    speech = {
      getVoices: () => [{ name: 'Daniel', lang: 'en-GB', localService: true }],
      onVoicesChanged: () => () => {},
      speak: (said, options) => {
        spoken.push(`${said}|${options.voice.name}`)
      },
      cancel: () => {},
    }
    renderAt(path, storeWith('general-english'))
    fireEvent.click(await screen.findByRole('button', { name: text.showModel }))
    fireEvent.click(screen.getByRole('button', { name: text.listenModel }))
    expect(spoken).toEqual([`${item.modelAnswer}|Daniel`])
  })

  it('saves the ticked boxes as a self-assessment and completes the activity, keeping earlier ones', async () => {
    const { unit, activity, item, path } = await speaking('career-readiness')
    const store = storeWith('career-readiness')
    const before = store.read()
    renderAt(path, store)
    fireEvent.click(await screen.findByRole('checkbox', { name: item.selfCheck[0].en }))
    fireEvent.click(screen.getByRole('checkbox', { name: item.selfCheck[2].en }))
    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    const first = store.read()
    expect(first.selfAssessments).toMatchObject([
      {
        kind: 'speaking',
        pathway: 'career-readiness',
        activityId: activity.id,
        itemId: item.id,
        skills: item.skills,
        selfCheck: [true, false, true],
      },
    ])
    expect(first.completions).toMatchObject([{ unitId: unit.id, activityId: activity.id }])
    expect(first.exerciseResults).toEqual([])
    expect(first.profile).toEqual(before.profile)
    // The summary recaps the ticks as the learner's own view (MVP-14).
    expect(screen.getByRole('heading', { level: 2, name: en.summary.completed })).toBeTruthy()
    expect(screen.getByText('You ticked 2 of 3 checks. This is your own view, not a test result.')).toBeTruthy()
    expect(screen.getByText(en.home.readiness.label)).toBeTruthy()
    cleanup()

    // Nothing ticked is a valid, honest answer, and repeats add a new entry.
    renderAt(path, store)
    fireEvent.click(await screen.findByRole('button', { name: text.finish }))
    const second = store.read()
    expect(second.selfAssessments).toHaveLength(2)
    expect(second.selfAssessments[0]).toEqual(first.selfAssessments[0])
    expect(second.selfAssessments[1].selfCheck).toEqual([false, false, false])
    expect(second.selfAssessments[1].id).not.toBe(second.selfAssessments[0].id)
    expect(second.completions).toHaveLength(1)
  })

  it('adds the native prompt and self-check lines under the switch, keeping hints and the model English', async () => {
    const { item, path } = await speaking()
    await act(() => i18n.changeLanguage('uz'))
    const store = storeWith('general-english')
    renderAt(path, store)
    expect(await screen.findByText(item.prompt.uz!)).toBeTruthy()
    expect(screen.getByText(uz.exercise.toggleHint)).toBeTruthy()
    expect(screen.getByText(item.selfCheck[0].uz!)).toBeTruthy()
    expect(screen.getByText(item.preparationHints[0])).toBeTruthy()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.queryByText(item.prompt.uz!)).toBeNull()
    expect(screen.queryByText(item.selfCheck[0].uz!)).toBeNull()
    expect(screen.getByText(item.prompt.en)).toBeTruthy()
  })
})
