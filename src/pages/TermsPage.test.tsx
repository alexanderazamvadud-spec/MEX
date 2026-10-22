// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import LandingPage from './LandingPage.tsx'
import TermsPage from './TermsPage.tsx'

function renderTerms(initialEntry: string | { pathname: string; state: unknown } = '/terms') {
  const router = createMemoryRouter(
    [
      { path: '/', element: <LandingPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/settings', element: <p>Settings screen</p> },
      { path: '/home', element: <p>Home screen</p> },
    ],
    { initialEntries: [initialEntry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('TermsPage', () => {
  it('shows the approved copyright notice, terms of use and privacy text', () => {
    renderTerms()
    expect(screen.getByRole('heading', { level: 1, name: en.legal.title })).toBeTruthy()
    expect(document.querySelector('[data-copyright]')?.textContent).toBe(
      '© 2026 Alexis Team LLC. All rights reserved. MEX — Modern Employability eXperience. The lessons in this pilot are sample content for testing.',
    )
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual([en.legal.termsTitle, en.legal.privacyTitle])
    for (const [key, item] of Object.entries(en.legal.terms)) {
      expect(document.querySelector(`[data-term="${key}"]`)?.textContent).toBe(`${item.title} ${item.body}`)
    }
    for (const [key, item] of Object.entries(en.legal.privacy)) {
      expect(document.querySelector(`[data-privacy="${key}"]`)?.textContent).toBe(`${item.title} ${item.body}`)
    }
    expect(document.querySelectorAll('[data-term]')).toHaveLength(6)
    expect(document.querySelectorAll('[data-privacy]')).toHaveLength(7)
  })

  it('makes no claims about accounts, AI marking or certificates being available', () => {
    renderTerms()
    const text = document.body.textContent ?? ''
    expect(text).toContain('MEX does not use AI.')
    expect(text).toContain('MEX does not test, grade or certify your English.')
    expect(text).not.toMatch(/sign up|sign in|log in|register/i)
  })

  it('links to the owner’s Telegram contact in a new tab', () => {
    renderTerms()
    const link = screen.getByRole('link', { name: /Telegram @Mr_rich_and_famous/ })
    expect(link.getAttribute('href')).toBe('https://t.me/Mr_rich_and_famous')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toContain(en.legal.opensNewTab)
  })

  it('goes back to the screen it was opened from, or to the landing page', async () => {
    renderTerms({ pathname: '/terms', state: { from: '/settings' } })
    expect(screen.getByRole('link', { name: en.learn.back }).getAttribute('href')).toBe('/settings')
    cleanup()
    const router = renderTerms()
    const back = screen.getByRole('link', { name: en.learn.back })
    expect(back.getAttribute('href')).toBe('/')
    await act(async () => {
      fireEvent.click(back)
    })
    expect(router.state.location.pathname).toBe('/')
  })

  it('opens from the landing page footer and reads and writes no learner data', async () => {
    const router = renderTerms('/')
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: en.legal.link }))
    })
    expect(router.state.location.pathname).toBe('/terms')
    expect(screen.getByRole('link', { name: en.learn.back }).getAttribute('href')).toBe('/')
    expect(window.localStorage.getItem('mex.learner')).toBeNull()
  })

  it('shows the Russian draft when the interface is in Russian', async () => {
    await act(() => i18n.changeLanguage('ru'))
    renderTerms()
    expect(screen.getByRole('heading', { level: 1, name: ru.legal.title })).toBeTruthy()
    expect(document.querySelector('[data-term="ai"]')?.textContent).toBe(`${ru.legal.terms.ai.title} ${ru.legal.terms.ai.body}`)
  })
})
