// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { ListeningItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import type { SpeakOptions, SpeechEngine, VoiceLike } from '../learner/speech.ts'
import { renderAt, storeWith } from './learnTestUtils.tsx'

// The test browser has no text-to-speech, so a fake engine stands in for the browser's.
interface FakeEngine extends SpeechEngine {
  voices: VoiceLike[]
  spoken: Array<{ text: string } & SpeakOptions>
  cancels: number
  fireVoicesChanged: () => void
}

let fake: FakeEngine | null = null

function fakeEngine(voices: VoiceLike[]): FakeEngine {
  const listeners = new Set<() => void>()
  const engine: FakeEngine = {
    voices,
    spoken: [],
    cancels: 0,
    getVoices: () => engine.voices,
    onVoicesChanged(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    speak(text, options) {
      engine.spoken.push({ text, ...options })
    },
    cancel() {
      engine.cancels += 1
    },
    fireVoicesChanged: () => listeners.forEach((listener) => listener()),
  }
  return engine
}

vi.mock('../learner/speech.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learner/speech.ts')>()
  return { ...actual, browserSpeech: () => fake }
})

const ONLINE_GB = { name: 'Google UK English', lang: 'en-GB', localService: false }
const LOCAL_US = { name: 'Samantha', lang: 'en-US', localService: true }
const LOCAL_RU = { name: 'Milena', lang: 'ru-RU', localService: true }
const text = en.listening

async function listening() {
  const pack = await loadPack('general-english')
  const unit = pack.units[0]
  const activity = unit.activities.find((item) => item.type === 'listening') as Activity
  const item = activity.items[0] as ListeningItem
  return { unit, activity, item, path: `/learn/general-english/${unit.id}/${activity.id}` }
}

function answerAll(item: ListeningItem) {
  item.questions.forEach((question, index) => {
    fireEvent.click(screen.getByRole('radio', { name: question.answer }))
    fireEvent.click(screen.getByRole('button', { name: en.exercise.check }))
    const isLast = index === item.questions.length - 1
    fireEvent.click(screen.getByRole('button', { name: isLast ? en.exercise.seeResults : en.exercise.next }))
  })
}

beforeEach(async () => {
  fake = null
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('ListeningPage with an on-device English voice', () => {
  it('speaks the transcript with the on-device voice only, at normal or slow speed, and can stop', async () => {
    fake = fakeEngine([ONLINE_GB, LOCAL_RU, LOCAL_US])
    const { item, path } = await listening()
    renderAt(path, storeWith('general-english'))
    await screen.findByRole('button', { name: text.listen })
    // The transcript is hidden at first.
    expect(document.querySelector('[data-text]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: text.listen }))
    expect(fake.spoken).toHaveLength(1)
    expect(fake.spoken[0].voice).toEqual(LOCAL_US)
    expect(fake.spoken[0].rate).toBe(1)
    expect(fake.spoken[0].text).toBe(item.transcript)
    const cancelsBeforeStop = fake.cancels
    fireEvent.click(screen.getByRole('button', { name: text.stop }))
    expect(fake.cancels).toBe(cancelsBeforeStop + 1)

    fireEvent.click(screen.getByRole('button', { name: text.listenSlowly }))
    expect(fake.spoken[1].rate).toBe(0.8)
    expect(fake.spoken[1].voice).toEqual(LOCAL_US)
    // Speech ending brings the buttons back.
    act(() => fake!.spoken[1].onEnd())
    expect(screen.getByRole('button', { name: text.listen })).toBeTruthy()
    // Stopping reports "interrupted", which is not a failure.
    fireEvent.click(screen.getByRole('button', { name: text.listen }))
    act(() => fake!.spoken[2].onError('interrupted'))
    expect(document.querySelector('[data-listening="player"]')).toBeTruthy()
  })

  it('shows and hides the transcript', async () => {
    fake = fakeEngine([LOCAL_US])
    const { item, path } = await listening()
    renderAt(path, storeWith('general-english'))
    const show = await screen.findByRole('button', { name: text.showText })
    expect(show.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(show)
    const card = within(document.querySelector<HTMLElement>('[data-text]')!)
    expect(card.getByText(item.transcript.split('\n')[0])).toBeTruthy()
    expect(screen.getByRole('button', { name: text.hideText }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: text.hideText }))
    expect(document.querySelector('[data-text]')).toBeNull()
  })

  it('saves listening results with the item skills and finishes', async () => {
    fake = fakeEngine([LOCAL_US])
    const { unit, activity, item, path } = await listening()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByRole('button', { name: text.listen })
    answerAll(item)
    expect(store.read().exerciseResults.map((result) => [result.itemId, result.skills])).toEqual(
      item.questions.map((_, index) => [`${item.id}-q${index + 1}`, item.skills]),
    )
    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    expect(store.read().completions).toMatchObject([{ unitId: unit.id, activityId: activity.id }])
  })

  it('waits for voices that load late', async () => {
    fake = fakeEngine([])
    const { path } = await listening()
    renderAt(path, storeWith('general-english'))
    await screen.findByText(`Question 1 of 3`)
    expect(document.querySelector('[data-listening="checking"]')).toBeTruthy()
    fake.voices = [LOCAL_US]
    act(() => fake!.fireVoicesChanged())
    expect(screen.getByRole('button', { name: text.listen })).toBeTruthy()
  })

  it('stops speaking when the learner leaves', async () => {
    fake = fakeEngine([LOCAL_US])
    const { path } = await listening()
    renderAt(path, storeWith('general-english'))
    fireEvent.click(await screen.findByRole('button', { name: text.listen }))
    const before = fake.cancels
    fireEvent.click(screen.getByRole('link', { name: en.learn.back }))
    await screen.findByText(en.learn.activities)
    expect(fake.cancels).toBeGreaterThan(before)
  })
})

describe('ListeningPage without a suitable voice', () => {
  async function expectTextOnly(item: ListeningItem) {
    const note = await screen.findByText(text.noVoice)
    expect(note.getAttribute('role')).toBe('status')
    expect(within(document.querySelector<HTMLElement>('[data-text]')!).getByText(item.transcript.split('\n')[0])).toBeTruthy()
    expect(screen.queryByRole('button', { name: text.listen })).toBeNull()
  }

  it('shows the text and the note when the browser has no text-to-speech, and saves the answers as reading', async () => {
    const { item, path } = await listening()
    const store = storeWith('general-english')
    renderAt(path, store)
    await expectTextOnly(item)
    answerAll(item)
    expect(store.read().exerciseResults.map((result) => result.skills)).toEqual(item.questions.map(() => ['reading', 'interaction']))
  })

  it('shows the text when only online English voices exist', async () => {
    fake = fakeEngine([ONLINE_GB, LOCAL_RU])
    const { item, path } = await listening()
    renderAt(path, storeWith('general-english'))
    await expectTextOnly(item)
  })

  it('shows the text when no voices arrive in time', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fake = fakeEngine([])
    const { item, path } = await listening()
    renderAt(path, storeWith('general-english'))
    await screen.findByText(`Question 1 of 3`)
    await act(() => vi.advanceTimersByTimeAsync(1600))
    await expectTextOnly(item)
  })

  it('switches to the text when speaking fails', async () => {
    fake = fakeEngine([LOCAL_US])
    const { item, path } = await listening()
    renderAt(path, storeWith('general-english'))
    fireEvent.click(await screen.findByRole('button', { name: text.listen }))
    act(() => fake!.spoken[0].onError('synthesis-failed'))
    await expectTextOnly(item)
  })
})
