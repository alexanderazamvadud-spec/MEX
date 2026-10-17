// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack, type Activity } from '../content/index.ts'
import type { ReadingItem } from '../content/types.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import { renderAt, storeWith } from './learnTestUtils.tsx'

async function reading() {
  const pack = await loadPack('general-english')
  const unit = pack.units[0]
  const activity = unit.activities.find((item) => item.type === 'reading') as Activity
  const item = activity.items[0] as ReadingItem
  return { unit, activity, item, path: `/learn/general-english/${unit.id}/${activity.id}` }
}

const check = () => fireEvent.click(screen.getByRole('button', { name: en.exercise.check }))

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('ReadingPage', () => {
  it('keeps the English text above every question', async () => {
    const { activity, item, path } = await reading()
    renderAt(path, storeWith('general-english'))
    expect(await screen.findByRole('heading', { level: 1, name: activity.title })).toBeTruthy()
    const text = () => document.querySelector<HTMLElement>('[data-text]')!
    expect(within(text()).getByText(item.text)).toBeTruthy()
    expect(text().getAttribute('lang')).toBe('en')
    expect(screen.getByText(`Question 1 of ${item.questions.length}`)).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: item.questions[0].prompt })).toBeTruthy()
    expect(screen.getByText(en.exercise.chooseAnswer)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: item.questions[0].answer }))
    check()
    fireEvent.click(screen.getByRole('button', { name: en.exercise.next }))
    expect(screen.getByText(`Question 2 of ${item.questions.length}`)).toBeTruthy()
    expect(within(text()).getByText(item.text)).toBeTruthy()
  })

  it('shows a wrong answer with its explanation and saves it with the question id and the item skills', async () => {
    const { activity, item, path } = await reading()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText(`Question 1 of ${item.questions.length}`)
    const question = item.questions[0]
    fireEvent.click(screen.getByRole('radio', { name: question.options.find((option) => option !== question.answer)! }))
    check()
    const feedback = within(document.querySelector<HTMLElement>('[data-feedback]')!)
    expect(feedback.getByText(en.exercise.incorrect)).toBeTruthy()
    expect(feedback.getByText(`The answer is: ${question.answer}`)).toBeTruthy()
    expect(feedback.getByText(question.explanation.en)).toBeTruthy()
    expect(store.read().exerciseResults).toMatchObject([
      { pathway: 'general-english', activityId: activity.id, itemId: `${item.id}-q1`, skills: item.skills, correct: false },
    ])
  })

  it('finishes with the practice score and records completion', async () => {
    const { unit, activity, item, path } = await reading()
    const store = storeWith('general-english')
    renderAt(path, store)
    await screen.findByText(`Question 1 of ${item.questions.length}`)
    item.questions.forEach((question, index) => {
      fireEvent.click(screen.getByRole('radio', { name: question.answer }))
      check()
      const isLast = index === item.questions.length - 1
      fireEvent.click(screen.getByRole('button', { name: isLast ? en.exercise.seeResults : en.exercise.next }))
    })
    expect(screen.getByRole('heading', { level: 2, name: `You got 3 of 3 right` })).toBeTruthy()
    expect(screen.getByText(en.exercise.practiceNote)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.reading.finish }))
    expect(store.read().completions).toMatchObject([{ unitId: unit.id, activityId: activity.id }])
    expect(store.read().exerciseResults.map((result) => result.itemId)).toEqual(['q1', 'q2', 'q3'].map((q) => `${item.id}-${q}`))
    expect(await screen.findByRole('heading', { level: 1, name: `Unit 1: ${unit.title}` })).toBeTruthy()
  })

  it('shows the reworded switch hint and the native explanation in Uzbek', async () => {
    const { item, path } = await reading()
    await act(() => i18n.changeLanguage('uz'))
    renderAt(path, storeWith('general-english'))
    await screen.findByText(`Savol: 1 / ${item.questions.length}`)
    expect(screen.getByText(uz.exercise.toggleHint)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: item.questions[0].answer }))
    fireEvent.click(screen.getByRole('button', { name: uz.exercise.check }))
    expect(screen.getByText(item.questions[0].explanation.uz!)).toBeTruthy()
  })
})
