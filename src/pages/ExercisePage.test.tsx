// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { GapFillItem, MatchingItem, MultipleChoiceItem, OrderingItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import { shuffled } from '../learner/exercise.ts'
import type { LearnerStore } from '../learner/types.ts'
import { renderAt, storeWith } from './learnTestUtils.tsx'

const text = en.exercise

async function firstExercise(pathway: 'general-english' | 'career-readiness' = 'general-english') {
  const pack = await loadPack(pathway)
  const unit = pack.units[0]
  const exercise = unit.activities.find((activity) => activity.type === 'exercise') as Activity
  const [choice, gap, matching, ordering] = exercise.items as [MultipleChoiceItem, GapFillItem, MatchingItem, OrderingItem]
  return { unit, exercise, choice, gap, matching, ordering, path: `/learn/${pathway}/${unit.id}/${exercise.id}` }
}

const check = () => fireEvent.click(screen.getByRole('button', { name: text.check }))
const next = () => fireEvent.click(screen.getByRole('button', { name: text.next }))

function answerMatching(item: MatchingItem, rights: string[]) {
  item.pairs.forEach((pair, index) => {
    fireEvent.change(screen.getByRole('combobox', { name: pair.left }), { target: { value: rights[index] } })
  })
}

function answerOrdering(segments: string[]) {
  for (const segment of segments) {
    const pool = screen.getAllByRole('list').at(-1)!
    fireEvent.click(within(pool).getAllByRole('button', { name: segment })[0])
  }
}

async function playAllCorrect(store: LearnerStore, path: string, items: Awaited<ReturnType<typeof firstExercise>>) {
  renderAt(path, store)
  await screen.findByText(`Question 1 of 4`)
  fireEvent.click(screen.getByRole('radio', { name: items.choice.answer }))
  check()
  next()
  fireEvent.click(screen.getByRole('radio', { name: items.gap.answer }))
  check()
  next()
  answerMatching(items.matching, items.matching.pairs.map((pair) => pair.right))
  check()
  next()
  answerOrdering(items.ordering.segments)
  check()
  fireEvent.click(screen.getByRole('button', { name: text.seeResults }))
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('ExercisePage', () => {
  it('shows one question at a time with its progress, the sample label and English content', async () => {
    const { exercise, choice, path } = await firstExercise()
    renderAt(path, storeWith('general-english'))
    expect(await screen.findByRole('heading', { level: 1, name: exercise.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText('Question 1 of 4')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: choice.prompt })).toBeTruthy()
    expect(screen.getByText(text.chooseAnswer)).toBeTruthy()
    expect(screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).value)).toEqual(choice.options)
    // English interface: nothing to translate, so no switch.
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('refuses Check until there is an answer, and saves nothing', async () => {
    const { path } = await firstExercise()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText('Question 1 of 4')
    check()
    expect(screen.getByRole('alert').textContent).toBe(text.errors.choose)
    expect(store.read().exerciseResults).toEqual([])
    expect(screen.getByRole('button', { name: text.check })).toBeTruthy()
  })

  it('shows a wrong answer with the right answer and the explanation, and saves one result with the skills', async () => {
    const { exercise, choice, path } = await firstExercise()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText('Question 1 of 4')
    const wrong = choice.options.find((option) => option !== choice.answer)!
    fireEvent.click(screen.getByRole('radio', { name: wrong }))
    check()

    const feedback = document.querySelector<HTMLElement>('[data-feedback]')!
    expect(feedback.getAttribute('data-feedback')).toBe('incorrect')
    expect(within(feedback).getByText(text.incorrect)).toBeTruthy()
    expect(within(feedback).getByText(`The answer is: ${choice.answer}`)).toBeTruthy()
    expect(within(feedback).getByText(choice.explanation.en)).toBeTruthy()
    expect(document.activeElement).toBe(feedback)
    // One attempt: the answer is locked.
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true)
    expect(screen.queryByRole('button', { name: text.check })).toBeNull()

    const results = store.read().exerciseResults
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      pathway: 'general-english',
      activityId: exercise.id,
      itemId: choice.id,
      skills: choice.skills,
      correct: false,
    })

    next()
    expect(screen.getByText('Question 2 of 4')).toBeTruthy()
    expect(document.activeElement?.tagName).toBe('H2')
  })

  it('fills the gap with the chosen option', async () => {
    const { choice, gap, path } = await firstExercise()
    renderAt(path, storeWith('general-english'))
    await screen.findByText('Question 1 of 4')
    fireEvent.click(screen.getByRole('radio', { name: choice.answer }))
    check()
    expect(screen.getByText(text.correct)).toBeTruthy()
    expect(screen.queryByText(/The answer is/)).toBeNull()
    next()
    expect(screen.getByText(text.fillGap)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: gap.answer }))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(gap.sentence.replace('___', gap.answer))
  })

  it('marks each matching pair and counts the item wrong when any pair is wrong', async () => {
    const { matching, path } = await firstExercise()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText('Question 1 of 4')
    fireEvent.click(screen.getAllByRole('radio')[0])
    check()
    next()
    fireEvent.click(screen.getAllByRole('radio')[0])
    check()
    next()
    expect(screen.getByRole('heading', { level: 2, name: matching.prompt })).toBeTruthy()
    // The dropdown lists the right-hand texts in a fixed shuffled order.
    const options = within(screen.getByRole('combobox', { name: matching.pairs[0].left })).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      text.chooseMatch,
      ...shuffled(matching.pairs.map((pair) => pair.right), `${matching.id}:right`),
    ])
    answerMatching(matching, [matching.pairs[0].right])
    check()
    expect(screen.getByRole('alert').textContent).toBe(text.errors.match)

    const swapped = [matching.pairs[0].right, matching.pairs[2].right, matching.pairs[1].right]
    answerMatching(matching, swapped)
    check()
    const pair = (index: number) => within(document.querySelector<HTMLElement>(`[data-pair="${index}"]`)!)
    expect(pair(0).getByText(text.correct)).toBeTruthy()
    expect(pair(1).getByText(`The answer is: ${matching.pairs[1].right}`)).toBeTruthy()
    expect(pair(2).getByText(`The answer is: ${matching.pairs[2].right}`)).toBeTruthy()
    expect(document.querySelector('[data-feedback]')?.getAttribute('data-feedback')).toBe('incorrect')
    expect(store.read().exerciseResults.at(-1)).toMatchObject({ itemId: matching.id, correct: false })
  })

  it('builds the ordering answer by tapping, with put back and Start again', async () => {
    const { matching, ordering, path } = await firstExercise()
    renderAt(path, storeWith('general-english'))
    await screen.findByText('Question 1 of 4')
    for (let step = 0; step < 2; step += 1) {
      fireEvent.click(screen.getAllByRole('radio')[0])
      check()
      next()
    }
    answerMatching(matching, matching.pairs.map((pair) => pair.right))
    check()
    next()

    expect(screen.getByText(text.tapInOrder)).toBeTruthy()
    const lists = screen.getAllByRole('list')
    const pool = lists.at(-1)!
    // Never shown already solved.
    expect(within(pool).getAllByRole('button').map((button) => button.textContent)).not.toEqual(ordering.segments)
    check()
    expect(screen.getByRole('alert').textContent).toBe(text.errors.place)

    answerOrdering(ordering.segments.slice(0, 2))
    const line = screen.getAllByRole('list').at(-2)!
    expect(screen.getByRole('list', { name: text.yourAnswer })).toBe(line)
    expect(within(line).getAllByRole('button').map((button) => button.textContent)).toEqual(ordering.segments.slice(0, 2))
    fireEvent.click(within(line).getByRole('button', { name: ordering.segments[0] }))
    expect(within(line).getAllByRole('button').map((button) => button.textContent)).toEqual([ordering.segments[1]])
    fireEvent.click(screen.getByRole('button', { name: text.startAgain }))
    expect(within(line).queryAllByRole('button')).toHaveLength(0)

    answerOrdering([...ordering.segments].reverse())
    check()
    expect(screen.getByText(`The answer is: ${ordering.segments.join(' ')}`)).toBeTruthy()
    expect(screen.getByRole('button', { name: text.seeResults })).toBeTruthy()
  })

  it('shows the score as practice and completes the activity on Finish, without touching readiness', async () => {
    const items = await firstExercise()
    const store = storeWith('general-english')
    const before = store.read()
    await playAllCorrect(store, items.path, items)

    expect(screen.getByRole('heading', { level: 2, name: 'You got 4 of 4 right' })).toBeTruthy()
    expect(screen.getByText(text.practiceNote)).toBeTruthy()
    expect(store.read().completions).toEqual([])
    const results = store.read().exerciseResults
    expect(results.map((result) => [result.itemId, result.correct])).toEqual(
      [items.choice, items.gap, items.matching, items.ordering].map((item) => [item.id, true]),
    )
    expect(results.map((result) => result.skills)).toEqual(
      [items.choice, items.gap, items.matching, items.ordering].map((item) => item.skills),
    )

    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    const after = store.read()
    expect(after.completions).toMatchObject([{ pathway: 'general-english', unitId: items.unit.id, activityId: items.exercise.id }])
    expect(after.profile).toEqual(before.profile)
    expect(after.selfAssessments).toEqual([])
    expect(await screen.findByRole('heading', { level: 1, name: `Unit 1: ${items.unit.title}` })).toBeTruthy()
  })

  it('lets mistakes finish too, and a replay adds new results while keeping the old ones', async () => {
    const items = await firstExercise('career-readiness')
    const store = storeWith('career-readiness')
    renderAt(items.path, store)
    await screen.findByText('Question 1 of 4')
    fireEvent.click(screen.getByRole('radio', { name: items.choice.options.find((option) => option !== items.choice.answer)! }))
    check()
    next()
    fireEvent.click(screen.getByRole('radio', { name: items.gap.answer }))
    check()
    next()
    answerMatching(items.matching, items.matching.pairs.map((pair) => pair.right))
    check()
    next()
    answerOrdering(items.ordering.segments)
    check()
    fireEvent.click(screen.getByRole('button', { name: text.seeResults }))
    expect(screen.getByRole('heading', { level: 2, name: 'You got 3 of 4 right' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    expect(store.read().completions).toHaveLength(1)
    const firstRun = store.read().exerciseResults
    cleanup()

    await playAllCorrect(store, items.path, items)
    fireEvent.click(screen.getByRole('button', { name: text.finish }))
    const record = store.read()
    expect(record.exerciseResults).toHaveLength(8)
    expect(record.exerciseResults.slice(0, 4)).toEqual(firstRun)
    expect(record.completions).toHaveLength(1)
  })

  it('keeps checked answers when leaving early, without completing, and starts again at question 1', async () => {
    const { choice, path } = await firstExercise()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText('Question 1 of 4')
    fireEvent.click(screen.getByRole('radio', { name: choice.answer }))
    check()
    next()
    fireEvent.click(screen.getByRole('link', { name: en.learn.back }))
    await screen.findByText(en.learn.activities)
    expect(store.read().exerciseResults).toHaveLength(1)
    expect(store.read().completions).toEqual([])
    cleanup()
    renderAt(path, store)
    expect(await screen.findByText('Question 1 of 4')).toBeTruthy()
  })

  it('shows the native explanation with the toggle on (default for Beginner) and hides it when off', async () => {
    const { choice, path } = await firstExercise()
    await act(() => i18n.changeLanguage('uz'))
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText('Savol: 1 / 4')
    fireEvent.click(screen.getByRole('radio', { name: choice.answer }))
    fireEvent.click(screen.getByRole('button', { name: uz.exercise.check }))
    const feedback = within(document.querySelector<HTMLElement>('[data-feedback]')!)
    expect(feedback.getByText(uz.exercise.correct)).toBeTruthy()
    expect(feedback.getByText(choice.explanation.en)).toBeTruthy()
    expect(feedback.getByText(choice.explanation.uz!)).toBeTruthy()
    // Prompts and options stay English.
    expect(screen.getByRole('heading', { level: 2 }).getAttribute('lang')).toBe('en')
    expect(screen.getByText(uz.exercise.toggleHint)).toBeTruthy()

    fireEvent.click(screen.getByRole('switch'))
    expect(store.read().preferences.nativeExplanations).toBe(false)
    expect(feedback.queryByText(choice.explanation.uz!)).toBeNull()
    expect(feedback.getByText(choice.explanation.en)).toBeTruthy()
  })

  it('starts with the native explanation off for other levels', async () => {
    const { choice, path } = await firstExercise()
    await act(() => i18n.changeLanguage('uz'))
    renderAt(path, storeWith('general-english', [], 'intermediate'))
    await screen.findByText('Savol: 1 / 4')
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false)
    fireEvent.click(screen.getByRole('radio', { name: choice.answer }))
    fireEvent.click(screen.getByRole('button', { name: uz.exercise.check }))
    expect(screen.queryByText(choice.explanation.uz!)).toBeNull()
  })
})
