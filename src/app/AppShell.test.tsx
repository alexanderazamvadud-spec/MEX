// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import AppShell from './AppShell.tsx'

function Late() {
  // Stands in for a screen whose h1 appears after its content loads.
  return <p>Loading</p>
}

function renderShell() {
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <h1>Home screen</h1> },
          { path: '/settings', element: <h1>Settings screen</h1> },
          { path: '/late', element: <Late /> },
          { path: '/other', element: <h1>Other</h1> },
        ],
      },
    ],
    { initialEntries: ['/home'] },
  )
  render(
    <LearnerProvider store={createLocalLearnerStore({ storage: null })}>
      <RouterProvider router={router} />
    </LearnerProvider>,
  )
  return router
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
})

describe('AppShell', () => {
  it('leaves focus alone on first load and names the section in the tab title', () => {
    renderShell()
    expect(document.activeElement).toBe(document.body)
    expect(document.title).toBe('Home · MEX')
  })

  it('moves focus to the new screen heading after navigation', async () => {
    const router = renderShell()
    await act(() => router.navigate('/settings'))
    const heading = screen.getByRole('heading', { level: 1, name: 'Settings screen' })
    expect(document.activeElement).toBe(heading)
    expect(heading.getAttribute('tabindex')).toBe('-1')
    expect(document.title).toBe('Settings · MEX')
    await act(() => router.navigate('/other'))
    expect(document.title).toBe('MEX')
  })

  it('waits for a heading that appears later', async () => {
    const router = renderShell()
    await act(() => router.navigate('/late'))
    expect(document.activeElement).toBe(document.body)
    const heading = document.createElement('h1')
    heading.textContent = 'Loaded'
    await act(async () => {
      document.querySelector('main')?.append(heading)
      await Promise.resolve()
    })
    expect(document.activeElement).toBe(heading)
  })
})
