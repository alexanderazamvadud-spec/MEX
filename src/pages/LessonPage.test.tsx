// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canOpen, loadPack, type Activity, type ContentPack } from '../content/index.ts'
import type { DialogueItem, GrammarNoteItem, PhraseItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import uz from '../i18n/locales/uz.json'
import { renderAt, storeWith } from './learnTestUtils.tsx'

// Every activity type has a player since MVP-16b, so a test-only activity stands in for an
// activity without a player.
vi.mock('../content/packs/career-readiness.json', async (importOriginal) => {
  const { withUnplayableActivity } = await import('./testPacks.ts')
  const actual = await importOriginal<{ default: ContentPack }>()
  return { default: withUnplayableActivity(actual.default) }
})

async function firstLesson(pathway: 'general-english' | 'career-readiness' = 'general-english') {
  const pack = await loadPack(pathway)
  const unit = pack.units[0]
  const lesson = unit.activities.find((activity) => activity.type === 'lesson') as Activity
  return { pack, unit, lesson, path: `/learn/${pathway}/${unit.id}/${lesson.id}` }
}

const phrases = (lesson: Activity) => lesson.items.filter((item): item is PhraseItem => item.kind === 'phrase')
const grammar = (lesson: Activity) => lesson.items.find((item): item is GrammarNoteItem => item.kind === 'grammar-note')!
const dialogue = (lesson: Activity) => lesson.items.find((item): item is DialogueItem => item.kind === 'dialogue')!
const nativeTexts = () => [...document.querySelectorAll('[data-native]')].map((element) => element.textContent)

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('LessonPage', () => {
  it('shows key phrases, the grammar note and the dialogue in pack order', async () => {
    const { lesson, unit, path } = await firstLesson()
    renderAt(path, storeWith('general-english'))
    expect(await screen.findByRole('heading', { level: 1, name: lesson.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText(lesson.instructions.en)).toBeTruthy()
    expect(screen.getByRole('link', { name: en.learn.back }).getAttribute('href')).toBe(`/learn/general-english/${unit.id}`)

    const headings = screen.getAllByRole('heading', { level: 2 }).map((element) => element.textContent)
    expect(headings).toEqual([en.lesson.phrases, en.lesson.grammar, en.lesson.dialogue])
    for (const phrase of phrases(lesson)) {
      const card = within(document.querySelector<HTMLElement>(`[data-item="${phrase.id}"]`)!)
      expect(card.getByText(phrase.phrase)).toBeTruthy()
      expect(card.getByText(phrase.example)).toBeTruthy()
      if (phrase.note) expect(card.getByText(phrase.note.en)).toBeTruthy()
    }
    const note = grammar(lesson)
    expect(screen.getByText(note.title)).toBeTruthy()
    expect(screen.getByText(note.explanation.en)).toBeTruthy()
    for (const example of note.examples) expect(screen.getByText(example)).toBeTruthy()
    const talk = within(document.querySelector<HTMLElement>(`[data-item="${dialogue(lesson).id}"]`)!)
    for (const line of dialogue(lesson).lines) expect(talk.getAllByText(line.text).length).toBeGreaterThan(0)
    expect(talk.getAllByText(dialogue(lesson).lines[0].speaker).length).toBeGreaterThan(0)
  })

  it('has no switch and no translations with English as the interface language', async () => {
    const { lesson, path } = await firstLesson()
    renderAt(path, storeWith('general-english', [], 'beginner'))
    await screen.findByRole('heading', { level: 1, name: lesson.title })
    expect(screen.queryByRole('switch')).toBeNull()
    expect(nativeTexts()).toEqual([])
  })

  it('shows Uzbek explanations by default for a Beginner, under the English, but never translates teaching content', async () => {
    await act(() => i18n.changeLanguage('uz'))
    const { lesson, path } = await firstLesson()
    renderAt(path, storeWith('general-english', [], 'beginner'))
    await screen.findByRole('heading', { level: 1, name: lesson.title })
    const toggle = screen.getByRole('switch', { name: new RegExp('Tushuntirishlar') })
    expect((toggle as HTMLInputElement).checked).toBe(true)
    const expected = [
      lesson.instructions.uz,
      ...phrases(lesson).flatMap((phrase) => (phrase.note?.uz ? [phrase.note.uz] : [])),
      grammar(lesson).explanation.uz,
    ]
    expect(nativeTexts()).toEqual(expected)
    expect(screen.getByText(lesson.instructions.en)).toBeTruthy()
    expect(document.querySelector('[data-item^="ge-01-a1-d"] [data-native]')).toBeNull()
    expect(screen.getByText(uz.lesson.phrases)).toBeTruthy()
  })

  it('starts off for other levels, and the saved choice applies to every lesson', async () => {
    await act(() => i18n.changeLanguage('ru'))
    const { lesson, path } = await firstLesson()
    const store = storeWith('general-english', [], 'elementary')
    renderAt(path, store)
    await screen.findByRole('heading', { level: 1, name: lesson.title })
    const toggle = screen.getByRole('switch', { name: ru.lesson.toggle.replace('{{language}}', 'Русский') })
    expect((toggle as HTMLInputElement).checked).toBe(false)
    expect(nativeTexts()).toEqual([])

    fireEvent.click(toggle)
    expect(store.read().preferences.nativeExplanations).toBe(true)
    expect(nativeTexts()[0]).toBe(lesson.instructions.ru)
    cleanup()

    const career = await firstLesson('career-readiness')
    renderAt(career.path, store)
    await screen.findByRole('heading', { level: 1, name: career.lesson.title })
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
    expect(nativeTexts()[0]).toBe(career.lesson.instructions.ru)
  })

  it('records one completion on Finish lesson, shows the summary, and returns to the unit', async () => {
    const { lesson, unit, path } = await firstLesson()
    const store = storeWith('general-english')
    const router = renderAt(path, store)
    await screen.findByRole('heading', { level: 1, name: lesson.title })
    fireEvent.click(screen.getByRole('button', { name: en.lesson.finish }))
    expect(screen.getByRole('heading', { level: 2, name: en.summary.completed })).toBeTruthy()
    expect(screen.getByText(en.summary.lessonRecap)).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: en.summary.backToUnit }))
    expect(router.state.location.pathname).toBe(`/learn/general-english/${unit.id}`)
    const completions = store.read().completions
    expect(completions).toHaveLength(1)
    expect(completions[0]).toMatchObject({ pathway: 'general-english', unitId: unit.id, activityId: lesson.id })
    expect(store.read().exerciseResults).toEqual([])
    expect(store.read().selfAssessments).toEqual([])

    const row = within(await screen.findByText(lesson.title).then((element) => element.closest('li') as HTMLElement))
    expect(row.getByText(en.learn.done)).toBeTruthy()

    await act(() => router.navigate(path))
    expect(await screen.findByText(en.learn.done)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.lesson.finish }))
    expect(store.read().completions).toHaveLength(1)
  })

  it("moves Today's mission on once the lesson is finished", async () => {
    const { lesson, unit, path } = await firstLesson()
    const store = storeWith('general-english')
    const router = renderAt(path, store)
    await screen.findByRole('heading', { level: 1, name: lesson.title })
    fireEvent.click(screen.getByRole('button', { name: en.lesson.finish }))
    await act(() => router.navigate('/home'))
    await screen.findByText(en.home.mission.why)
    expect([...document.querySelectorAll('[data-block="mission"] [data-rule]')].map((item) => item.textContent)).toEqual([
      unit.activities[1].title,
      unit.activities[2].title,
    ])
    expect(screen.getByText(`1 of ${unit.activities.length} activities completed`)).toBeTruthy()
  })

  it('shows Not found for an unknown activity or one without a player', async () => {
    const { unit } = await firstLesson()
    renderAt(`/learn/general-english/${unit.id}/nothing-here`, storeWith('general-english'))
    expect(await screen.findByRole('heading', { name: en.notFound.title })).toBeTruthy()
    cleanup()
    const career = (await loadPack('career-readiness')).units[0]
    const writing = career.activities.find((activity) => !canOpen(activity))!
    renderAt(`/learn/career-readiness/${career.id}/${writing.id}`, storeWith('career-readiness'))
    expect(await screen.findByRole('heading', { name: en.notFound.title })).toBeTruthy()
  })
})
