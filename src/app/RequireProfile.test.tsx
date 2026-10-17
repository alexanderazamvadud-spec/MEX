// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import '../i18n/index.ts'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import type { LearnerStore } from '../learner/types.ts'
import RequireProfile from './RequireProfile.tsx'

function renderAt(path: string, store: LearnerStore) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Landing</p> },
      { path: '/onboarding', element: <p>Onboarding</p> },
      {
        element: <RequireProfile />,
        children: [
          { path: '/home', element: <p>Home</p> },
          { path: '/learn', element: <p>Learn</p> },
          { path: '/progress', element: <p>Progress</p> },
        ],
      },
      { path: '/settings', element: <p>Settings</p> },
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

afterEach(cleanup)

describe('RequireProfile', () => {
  it.each(['/home', '/learn', '/progress'])('sends learners without a profile from %s to onboarding', (path) => {
    const router = renderAt(path, createLocalLearnerStore({ storage: null }))
    expect(router.state.location.pathname).toBe('/onboarding')
    expect(screen.getByText('Onboarding')).toBeTruthy()
  })

  it('lets learners with a profile through', () => {
    const store = createLocalLearnerStore({ storage: null })
    const now = '2026-10-17T10:00:00.000Z'
    store.update((record) => ({
      ...record,
      profile: { interfaceLanguage: 'en', level: 'beginner', goals: ['study'], pathway: 'general-english', createdAt: now, updatedAt: now },
    }))
    const router = renderAt('/home', store)
    expect(router.state.location.pathname).toBe('/home')
    expect(screen.getByText('Home')).toBeTruthy()
  })

  it('leaves the landing page and Settings open to learners without a profile', () => {
    expect(renderAt('/', createLocalLearnerStore({ storage: null })).state.location.pathname).toBe('/')
    cleanup()
    expect(renderAt('/settings', createLocalLearnerStore({ storage: null })).state.location.pathname).toBe('/settings')
  })
})
