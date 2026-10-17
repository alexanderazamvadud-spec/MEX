import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { PathwayId } from '../content/index.ts'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import { withOnboardingProfile } from '../learner/profile.ts'
import type { ActivityCompletion, LearnerStore } from '../learner/types.ts'
import HomePage from './HomePage.tsx'
import LearnPage from './LearnPage.tsx'
import LessonPage from './LessonPage.tsx'
import PathwayPage from './PathwayPage.tsx'
import UnitPage from './UnitPage.tsx'

// Shared helpers for the Learn screen tests (not a test file itself).

export function storeWith(
  pathway: PathwayId,
  completions: ActivityCompletion[] = [],
  level: 'beginner' | 'elementary' | 'intermediate' = 'beginner',
): LearnerStore {
  const store = createLocalLearnerStore({ storage: null })
  store.update((current) => ({
    ...withOnboardingProfile(
      current,
      { interfaceLanguage: 'en', level, goals: ['study'], pathway },
      '2026-10-01T00:00:00.000Z',
    ),
    completions,
  }))
  return store
}

export function renderAt(path: string, store: LearnerStore) {
  const router = createMemoryRouter(
    [
      { path: '/home', element: <HomePage /> },
      { path: '/learn', element: <LearnPage /> },
      { path: '/learn/:pathway', element: <PathwayPage /> },
      { path: '/learn/:pathway/:unit', element: <UnitPage /> },
      { path: '/learn/:pathway/:unit/:activity', element: <LessonPage /> },
    ],
    { initialEntries: [path] },
  )
  render(
    <LearnerProvider store={store}>
      <RouterProvider router={router} />
    </LearnerProvider>,
  )
  return router
}
