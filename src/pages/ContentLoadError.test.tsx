// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContentLoadError from '../components/ui/ContentLoadError.tsx'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { renderAt, storeWith } from './learnTestUtils.tsx'
import ProgressPage from './ProgressPage.tsx'

// Every content pack fails to load, as when the connection drops after the app opened.
vi.mock('../content/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../content/index.ts')>()
  return { ...actual, loadPack: () => Promise.reject(new Error('offline')) }
})

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function expectMessage() {
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain(en.app.contentError)
  expect(screen.getByRole('button', { name: en.app.tryAgain })).toBeTruthy()
  expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0)
}

describe('content-load message', () => {
  it.each([
    ['Home', '/home'],
    ['Pathway', '/learn/general-english'],
    ['Unit', '/learn/general-english/ge-01-meeting-people'],
    ['Activity', '/learn/general-english/ge-01-meeting-people/ge-01-a1-lesson'],
  ])('replaces the content on %s', async (_name, path) => {
    renderAt(path, storeWith('general-english'))
    await expectMessage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('shows on Progress inside the curriculum part, with the other parts kept', async () => {
    render(
      <LearnerProvider store={storeWith('career-readiness')}>
        <MemoryRouter>
          <ProgressPage />
        </MemoryRouter>
      </LearnerProvider>,
    )
    await expectMessage()
    expect(document.querySelector('[data-layer="curriculum"] [data-content-error]')).toBeTruthy()
    expect(document.querySelector('[data-layer="skills"]')).toBeTruthy()
    expect(document.querySelector('[data-layer="readiness"]')).toBeTruthy()
  })

  it('keeps Current Readiness on Home', async () => {
    renderAt('/home', storeWith('career-readiness'))
    await expectMessage()
    expect(document.querySelector('[data-block="readiness"]')).toBeTruthy()
    expect(document.querySelector('[data-block="mission"]')).toBeNull()
  })

  it('tries again when the button is pressed', () => {
    const retry = vi.fn()
    render(<ContentLoadError onRetry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: en.app.tryAgain }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
