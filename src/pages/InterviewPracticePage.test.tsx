// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { InterviewQuestionItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import type { RecordingEngine } from '../learner/recording.ts'
import { MAX_ANSWER_LENGTH } from '../learner/selfAssessment.ts'
import type { SpeechEngine } from '../learner/speech.ts'
import type { LearnerStore } from '../learner/types.ts'
import { renderAt, storeWith } from './learnTestUtils.tsx'
import SettingsPage from './SettingsPage.tsx'

// The test browser has no microphone or speech, so fakes stand in for both.
let recorder: RecordingEngine & { starts: number }
let speech: SpeechEngine | null = null

vi.mock('../learner/recording.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learner/recording.ts')>()
  return { ...actual, browserRecording: () => recorder }
})
vi.mock('../learner/speech.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learner/speech.ts')>()
  return { ...actual, browserSpeech: () => speech }
})

const text = en.interview
let revoked: string[]

async function interview() {
  const pack = await loadPack('career-readiness')
  const unit = pack.units[0]
  const activity = unit.activities.find((item) => item.type === 'interview-practice') as Activity
  const items = activity.items as InterviewQuestionItem[]
  return { unit, activity, items, path: `/learn/career-readiness/${unit.id}/${activity.id}` }
}

const button = (name: string) => screen.getByRole('button', { name })

beforeEach(async () => {
  recorder = {
    starts: 0,
    async start(handlers) {
      recorder.starts += 1
      return { stop: () => handlers.onClip(new Blob(['audio'], { type: 'audio/webm' })) }
    },
  }
  speech = null
  revoked = []
  let made = 0
  URL.createObjectURL = vi.fn(() => `blob:test/${++made}`)
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('InterviewPracticePage', () => {
  it('shows one question at a time, labelled as a self-assessment, with English content', async () => {
    const { activity, items, path } = await interview()
    renderAt(path, storeWith('career-readiness'))
    expect(await screen.findByRole('heading', { level: 1, name: activity.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText(en.home.readiness.label)).toBeTruthy()
    expect(screen.getByText('Question 1 of 3')).toBeTruthy()
    const question = screen.getByRole('heading', { level: 2, name: items[0].question })
    expect(question.getAttribute('lang')).toBe('en')
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      text.phrases,
      text.answer,
      text.models,
      text.check,
    ])
    for (const phrase of items[0].usefulPhrases) expect(screen.getByText(phrase)).toBeTruthy()
    expect(screen.getByText(text.selfNote)).toBeTruthy()
    expect(screen.getByText(text.savedNote)).toBeTruthy()
    expect(screen.getByRole('group', { name: text.confidence })).toBeTruthy()
    expect(screen.queryByRole('button', { name: text.finish })).toBeNull()
    expect(document.body.textContent).not.toMatch(/assessed|demonstrated|scored/i)
  })

  it('saves each question on Next and completes on Finish, keeping blank parts out', async () => {
    const { unit, activity, items, path } = await interview()
    const store = storeWith('career-readiness')
    const before = store.read()
    renderAt(path, store)
    fireEvent.change(await screen.findByLabelText(text.typeLabel), { target: { value: '  I am Aziz, a hotel receptionist.  ' } })
    fireEvent.click(screen.getByRole('checkbox', { name: items[0].selfCheck[1].en }))
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    fireEvent.click(button(text.next))
    expect(store.read().selfAssessments).toMatchObject([
      {
        kind: 'interview-question',
        pathway: 'career-readiness',
        activityId: activity.id,
        itemId: items[0].id,
        skills: items[0].skills,
        answerText: 'I am Aziz, a hotel receptionist.',
        selfCheck: [false, true, false],
        confidence: 4,
      },
    ])
    expect(store.read().completions).toEqual([])

    // Question 2 starts empty; nothing typed and no confidence saves neither.
    expect(await screen.findByText('Question 2 of 3')).toBeTruthy()
    expect((screen.getByLabelText(text.typeLabel) as HTMLTextAreaElement).value).toBe('')
    expect(screen.getByRole('heading', { level: 2, name: items[1].question })).toBe(document.activeElement)
    fireEvent.click(button(text.next))
    const second = store.read().selfAssessments[1]
    expect(second.itemId).toBe(items[1].id)
    expect(second).not.toHaveProperty('answerText')
    expect(second).not.toHaveProperty('confidence')
    expect(second.selfCheck).toEqual([false, false, false])

    await screen.findByText('Question 3 of 3')
    expect(screen.queryByRole('button', { name: text.next })).toBeNull()
    fireEvent.click(button(text.finish))
    const after = store.read()
    expect(after.selfAssessments.map((entry) => entry.itemId)).toEqual(items.map((item) => item.id))
    expect(after.completions).toMatchObject([{ unitId: unit.id, activityId: activity.id }])
    expect(after.exerciseResults).toEqual([])
    expect(after.profile).toEqual(before.profile)
    expect(await screen.findByRole('heading', { level: 1, name: `Unit 1: ${unit.title}` })).toBeTruthy()
  })

  it('keeps answers already saved when the learner leaves half-way, and repeats add new entries', async () => {
    const { path } = await interview()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    fireEvent.click(await screen.findByRole('button', { name: text.next }))
    fireEvent.click(screen.getByRole('link', { name: en.learn.back }))
    await screen.findByText(en.learn.activities)
    expect(store.read().selfAssessments).toHaveLength(1)
    expect(store.read().completions).toEqual([])
    cleanup()
    renderAt(path, store)
    fireEvent.click(await screen.findByRole('button', { name: text.next }))
    expect(store.read().selfAssessments).toHaveLength(2)
    expect(store.read().selfAssessments[1].id).not.toBe(store.read().selfAssessments[0].id)
  })

  it('limits the typed answer to 1,000 characters', async () => {
    const { path } = await interview()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    const box = (await screen.findByLabelText(text.typeLabel)) as HTMLTextAreaElement
    expect(box.maxLength).toBe(MAX_ANSWER_LENGTH)
    fireEvent.change(box, { target: { value: 'a'.repeat(MAX_ANSWER_LENGTH + 50) } })
    fireEvent.click(button(text.next))
    expect(store.read().selfAssessments[0].answerText).toHaveLength(MAX_ANSWER_LENGTH)
  })

  it('shows both model answers on request, and hides them again for the next question', async () => {
    const { items, path } = await interview()
    renderAt(path, storeWith('career-readiness'))
    expect(screen.queryByText(items[0].modelAnswers[0])).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: text.showModels }))
    for (const model of items[0].modelAnswers) expect(screen.getByText(model).getAttribute('lang')).toBe('en')
    expect(screen.getByText('Example 2')).toBeTruthy()
    fireEvent.click(button(text.next))
    await screen.findByText('Question 2 of 3')
    expect(screen.queryByText(items[1].modelAnswers[0])).toBeNull()
    expect(button(text.showModels)).toBeTruthy()
  })

  it('asks for the microphone only on Record, never saves the clip, and deletes it on Next', async () => {
    const { path } = await interview()
    const store = storeWith('career-readiness')
    renderAt(path, store)
    const record = await screen.findByRole('button', { name: en.speaking.record })
    expect(recorder.starts).toBe(0)
    await act(async () => fireEvent.click(record))
    expect(recorder.starts).toBe(1)
    fireEvent.click(button(en.speaking.stop))
    expect(document.querySelector('audio')!.getAttribute('src')).toBe('blob:test/1')
    fireEvent.click(button(text.next))
    await screen.findByText('Question 2 of 3')
    expect(document.querySelector('audio')).toBeNull()
    expect(revoked).toEqual(['blob:test/1'])
    expect(JSON.stringify(store.read())).not.toMatch(/blob:|audio/)
  })

  it('offers Listen to the question only with an on-device English voice', async () => {
    const { items, path } = await interview()
    renderAt(path, storeWith('career-readiness'))
    await screen.findByText('Question 1 of 3')
    expect(screen.queryByRole('button', { name: text.listen })).toBeNull()
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
    renderAt(path, storeWith('career-readiness'))
    fireEvent.click(await screen.findByRole('button', { name: text.listen }))
    expect(spoken).toEqual([`${items[0].question}|Daniel`])
  })

  it('adds the native instructions and self-check lines under the switch, keeping the question English', async () => {
    const { activity, items, path } = await interview()
    await act(() => i18n.changeLanguage('uz'))
    renderAt(path, storeWith('career-readiness'))
    expect(await screen.findByText(activity.instructions.uz!)).toBeTruthy()
    expect(screen.getByText(items[0].selfCheck[0].uz!)).toBeTruthy()
    expect(screen.getByText(uz.interview.questionOf.replace('{{n}}', '1').replace('{{total}}', '3'))).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: items[0].question })).toBeTruthy()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.queryByText(items[0].selfCheck[0].uz!)).toBeNull()
    expect(screen.queryByText(activity.instructions.uz!)).toBeNull()
  })

  it('removes typed answers with Delete my data', async () => {
    const { path } = await interview()
    const store: LearnerStore = storeWith('career-readiness')
    renderAt(path, store)
    fireEvent.change(await screen.findByLabelText(text.typeLabel), { target: { value: 'My private answer' } })
    fireEvent.click(button(text.next))
    expect(JSON.stringify(store.read())).toContain('My private answer')
    cleanup()

    render(
      <LearnerProvider store={store}>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </LearnerProvider>,
    )
    fireEvent.click(button(en.settings.deleteData))
    fireEvent.click(button(en.settings.deleteConfirmYes))
    expect(await screen.findByText(en.settings.deleted)).toBeTruthy()
    expect(store.read().selfAssessments).toEqual([])
    expect(JSON.stringify(store.read())).not.toContain('My private answer')
  })
})
