// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { renderAt, storeWith } from './learnTestUtils.tsx'
import SettingsPage from './SettingsPage.tsx'

// The activity summary (MVP-14), reached here through the lesson, the quickest activity to finish.
const text = en.summary

async function lesson() {
  const pack = await loadPack('general-english')
  const unit = pack.units[0]
  const [first, second] = unit.activities
  return { unit, first, second, path: `/learn/general-english/${unit.id}/${first.id}` }
}

async function finishLesson(path: string, store = storeWith('general-english'), finish = en.lesson.finish) {
  const router = renderAt(path, store)
  fireEvent.click(await screen.findByRole('button', { name: finish }))
  return router
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('Activity summary', () => {
  it('confirms completion with labels, the recap and the optional rating, and takes focus', async () => {
    const { first, path } = await lesson()
    await finishLesson(path)
    const heading = screen.getByRole('heading', { level: 2, name: text.completed })
    expect(heading).toBe(document.activeElement)
    expect(screen.getByRole('heading', { level: 1, name: first.title })).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    expect(screen.getByText(en.learn.done)).toBeTruthy()
    expect(screen.queryByText(en.home.readiness.label)).toBeNull()
    expect(screen.getByText(text.lessonRecap)).toBeTruthy()
    expect(screen.getByRole('group', { name: text.useful })).toBeTruthy()
    expect(screen.getByText(text.notUseful)).toBeTruthy()
    expect(screen.getByText(text.veryUseful)).toBeTruthy()
    expect(screen.queryByText(text.thanks)).toBeNull()
    expect(document.querySelectorAll('[data-summary] .bg-accent')).toHaveLength(1)
  })

  it('leaves without a rating, saving none', async () => {
    const { unit, path } = await lesson()
    const store = storeWith('general-english')
    const router = await finishLesson(path, store)
    fireEvent.click(screen.getByRole('link', { name: text.backToUnit }))
    expect(router.state.location.pathname).toBe(`/learn/general-english/${unit.id}`)
    expect(store.read().usefulnessRatings).toEqual([])
    expect(store.read().completions).toHaveLength(1)
  })

  it('saves the rating on tap, changes it in place, and adds a new one on a later visit', async () => {
    const { first, path } = await lesson()
    const store = storeWith('general-english')
    await finishLesson(path, store)
    const before = store.read()
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    expect(screen.getByText(text.thanks)).toBeTruthy()
    expect(store.read().usefulnessRatings).toMatchObject([{ activityId: first.id, rating: 4 }])
    fireEvent.click(screen.getByRole('radio', { name: '2' }))
    expect(store.read().usefulnessRatings).toMatchObject([{ activityId: first.id, rating: 2 }])
    // The rating changes nothing else: completion, results, self-assessments, profile.
    expect({ ...store.read(), usefulnessRatings: [], updatedAt: null }).toEqual({ ...before, usefulnessRatings: [], updatedAt: null })
    cleanup()

    await finishLesson(path, store)
    fireEvent.click(screen.getByRole('radio', { name: '5' }))
    expect(store.read().usefulnessRatings.map((entry) => entry.rating)).toEqual([2, 5])
    expect(store.read().completions).toHaveLength(1)
  })

  it('opens the next activity in the unit at its beginning', async () => {
    const { unit, second, path } = await lesson()
    const router = await finishLesson(path)
    fireEvent.click(screen.getByRole('link', { name: text.next }))
    expect(router.state.location.pathname).toBe(`/learn/general-english/${unit.id}/${second.id}`)
    expect(await screen.findByRole('heading', { level: 1, name: second.title })).toBeTruthy()
    expect(screen.getByText('Question 1 of 4')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: text.completed })).toBeNull()
  })

  it('is translated, with the activity title kept in English', async () => {
    const { first, path } = await lesson()
    await act(() => i18n.changeLanguage('uz'))
    await finishLesson(path, storeWith('general-english'), uz.lesson.finish)
    expect(screen.getByRole('heading', { level: 2, name: uz.summary.completed })).toBeTruthy()
    expect(screen.getByText(uz.summary.lessonRecap)).toBeTruthy()
    expect(screen.getByRole('link', { name: uz.summary.next })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: first.title }).getAttribute('lang')).toBe('en')
  })

  it('has its ratings removed by Delete my data', async () => {
    const { path } = await lesson()
    const store = storeWith('general-english')
    await finishLesson(path, store)
    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(store.read().usefulnessRatings).toHaveLength(1)
    cleanup()
    render(
      <LearnerProvider store={store}>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </LearnerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: en.settings.deleteData }))
    fireEvent.click(screen.getByRole('button', { name: en.settings.deleteConfirmYes }))
    expect(await screen.findByText(en.settings.deleted)).toBeTruthy()
    expect(store.read().usefulnessRatings).toEqual([])
  })
})
