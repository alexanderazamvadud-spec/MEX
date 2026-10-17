// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import { createEmptyRecord, type LearnerRecord, type LearnerStore } from '../learner/types.ts'
import OnboardingPage from './OnboardingPage.tsx'

const ob = en.onboarding

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

function renderOnboarding(store: LearnerStore = createLocalLearnerStore({ storage: memoryStorage() })) {
  const router = createMemoryRouter(
    [
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/home', element: <p>Home screen</p> },
    ],
    { initialEntries: ['/onboarding'] },
  )
  render(
    <LearnerProvider store={store}>
      <RouterProvider router={router} />
    </LearnerProvider>,
  )
  return { router, store }
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: ob.next }))
}

function heading() {
  return screen.getByRole('heading', { level: 1 }).textContent
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('OnboardingPage', () => {
  it('asks the four questions in the approved order with a step counter', () => {
    renderOnboarding()
    expect(heading()).toBe(ob.language.question)
    expect(screen.getByText('Step 1 of 4')).toBeTruthy()
    expect(screen.getByText(ob.language.hint)).toBeTruthy()
    next()
    expect(heading()).toBe(ob.level.question)
    expect(screen.getByText('Step 2 of 4')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    expect(heading()).toBe(ob.goals.question)
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.study }))
    next()
    expect(heading()).toBe(ob.pathway.question)
    expect(screen.getByText('Step 4 of 4')).toBeTruthy()
    expect(screen.getByRole('button', { name: ob.start })).toBeTruthy()
  })

  it('changes the interface language at once on step 1', async () => {
    renderOnboarding()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Русский' }))
    })
    expect(heading()).toBe(ru.onboarding.language.question)
    expect(screen.getByText('Шаг 1 из 4')).toBeTruthy()
  })

  it('shows plain-word levels labelled as an estimate, with no CEFR codes', () => {
    renderOnboarding()
    next()
    expect(screen.getByText(ob.level.note)).toBeTruthy()
    for (const level of ['beginner', 'elementary', 'intermediate'] as const) {
      expect(screen.getByText(ob.level[level].description)).toBeTruthy()
    }
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(document.body.textContent).not.toMatch(/\b[ABC][12]\b/)
  })

  it('does not move on without an answer and says why', () => {
    renderOnboarding()
    next()
    next()
    expect(heading()).toBe(ob.level.question)
    expect(screen.getByRole('alert').textContent).toBe(ob.errors.chooseOne)
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.elementary.name) }))
    expect(screen.queryByRole('alert')).toBeNull()
    next()
    next()
    expect(heading()).toBe(ob.goals.question)
    expect(screen.getByRole('alert').textContent).toBe(ob.errors.chooseGoal)
  })

  it('allows several goals', () => {
    renderOnboarding()
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.everyday }))
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.work }))
    expect(screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked)).toHaveLength(2)
  })

  it('shows both pathways equally with nothing preselected, whatever the goals', () => {
    renderOnboarding()
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.work }))
    next()
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.map((radio) => radio.value)).toEqual(['general-english', 'career-readiness'])
    expect(radios.some((radio) => radio.checked)).toBe(false)
    expect(radios[0].closest('label')?.className).toBe(radios[1].closest('label')?.className)
    expect(screen.getByText(en.landing.pathways.generalEnglish.body)).toBeTruthy()
    expect(screen.getByText(en.landing.pathways.careerReadiness.body)).toBeTruthy()
  })

  it('keeps answers when going back', () => {
    renderOnboarding()
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.intermediate.name) }))
    next()
    fireEvent.click(screen.getByRole('button', { name: ob.back }))
    expect((screen.getByRole('radio', { name: new RegExp(ob.level.intermediate.name) }) as HTMLInputElement).checked).toBe(true)
  })

  it('saves the profile on "Start learning" and opens Home, keeping existing history', async () => {
    const storage = memoryStorage()
    const store = createLocalLearnerStore({ storage })
    const completion = { pathway: 'general-english' as const, unitId: 'u', activityId: 'a', completedAt: 'x' }
    store.update((record) => ({ ...record, completions: [completion] }))
    const { router } = renderOnboarding(store)
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.elementary.name) }))
    next()
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.study }))
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.everyday }))
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.landing.pathways.careerReadiness.name) }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: ob.start }))
    })
    expect(router.state.location.pathname).toBe('/home')
    const saved: LearnerRecord = JSON.parse(storage.getItem('mex.learner') ?? 'null')
    expect(saved.profile).toMatchObject({
      interfaceLanguage: 'en',
      level: 'elementary',
      goals: ['everyday', 'study'],
      pathway: 'career-readiness',
    })
    expect(saved.completions).toEqual([completion])
  })

  it('saves nothing when the learner leaves before the end', () => {
    const store = createLocalLearnerStore({ storage: memoryStorage() })
    renderOnboarding(store)
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    cleanup()
    expect(store.read()).toEqual(createEmptyRecord())
  })

  it('prefills a returning learner and keeps the first createdAt', async () => {
    const store = createLocalLearnerStore({ storage: memoryStorage() })
    const created = '2026-10-01T08:00:00.000Z'
    store.update((record) => ({
      ...record,
      profile: { interfaceLanguage: 'en', level: 'beginner', goals: ['work'], pathway: 'general-english', createdAt: created, updatedAt: created },
    }))
    renderOnboarding(store)
    next()
    expect((screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }) as HTMLInputElement).checked).toBe(true)
    next()
    expect((screen.getByRole('checkbox', { name: ob.goals.work }) as HTMLInputElement).checked).toBe(true)
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.landing.pathways.careerReadiness.name) }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: ob.start }))
    })
    expect(store.read().profile?.createdAt).toBe(created)
    expect(store.read().profile?.pathway).toBe('career-readiness')
  })

  it('shows the storage notice on the last step only when saving is impossible', () => {
    renderOnboarding(createLocalLearnerStore({ storage: null }))
    expect(screen.queryByText(ob.storageNotice)).toBeNull()
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.study }))
    next()
    expect(screen.getByText(ob.storageNotice)).toBeTruthy()
  })

  it('does not show the storage notice when saving works', () => {
    renderOnboarding()
    next()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(ob.level.beginner.name) }))
    next()
    fireEvent.click(screen.getByRole('checkbox', { name: ob.goals.study }))
    next()
    expect(screen.queryByText(ob.storageNotice)).toBeNull()
  })
})
