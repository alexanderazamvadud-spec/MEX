// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import LandingPage from './LandingPage.tsx'

// The landing page inside a memory router with stand-ins for the screens it links to.
function renderLanding() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <LandingPage /> },
      { path: '/home', element: <p>Home screen</p> },
      { path: '/settings', element: <p>Settings screen</p> },
      { path: '/terms', element: <p>Terms screen</p> },
    ],
    { initialEntries: ['/'] },
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
  vi.restoreAllMocks()
})

describe('LandingPage', () => {
  it('shows the approved headline and supporting text', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: en.landing.hero.title })).toBeTruthy()
    expect(screen.getByText(en.landing.hero.body)).toBeTruthy()
  })

  it('presents both pathways with equal prominence', () => {
    renderLanding()
    const cards = document.querySelectorAll('[data-pathway]')
    expect([...cards].map((card) => card.getAttribute('data-pathway'))).toEqual(['general-english', 'career-readiness'])
    // Same element, same classes, same heading level: neither pathway is styled as secondary.
    expect(cards[0].className).toBe(cards[1].className)
    const general = within(cards[0] as HTMLElement).getByRole('heading', { level: 3 })
    const career = within(cards[1] as HTMLElement).getByRole('heading', { level: 3 })
    expect(general.textContent).toBe(en.landing.pathways.generalEnglish.name)
    expect(career.textContent).toBe(en.landing.pathways.careerReadiness.name)
    expect(general.className).toBe(career.className)
    expect(screen.getByText(en.landing.pathways.generalEnglish.body)).toBeTruthy()
    expect(screen.getByText(en.landing.pathways.careerReadiness.body)).toBeTruthy()
  })

  it('has every section in the approved order', () => {
    renderLanding()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual([
      en.landing.pathways.title,
      en.landing.how.title,
      en.landing.audience.title,
      en.landing.status.title,
    ])
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('contentinfo').textContent).toContain(
      '© 2026 Alexis Team LLC. All rights reserved. MEX — Modern Employability eXperience. The lessons in this pilot are sample content for testing.',
    )
  })

  it('opens the demo from the primary call to action', async () => {
    const router = renderLanding()
    const cta = screen.getByRole('link', { name: en.landing.hero.primaryCta })
    expect(cta.getAttribute('href')).toBe('/home')
    await act(async () => {
      fireEvent.click(cta)
    })
    expect(router.state.location.pathname).toBe('/home')
    expect(screen.getByText('Home screen')).toBeTruthy()
  })

  it('offers demo access in the header', () => {
    renderLanding()
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: en.landing.header.demo }).getAttribute('href')).toBe('/home')
    expect(within(header).getByRole('button', { name: /Interface language/ })).toBeTruthy()
  })

  it('scrolls to the pathways without changing the route', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const router = renderLanding()
    fireEvent.click(screen.getByRole('button', { name: en.landing.hero.secondaryCta }))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('pathways'))
    expect(document.activeElement?.textContent).toBe(en.landing.pathways.title)
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('')
    // jsdom has no scrollIntoView of its own, so remove the stand-in again.
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  it('links only to existing screens and offers no sign-up or onboarding', () => {
    renderLanding()
    const targets = new Set(screen.getAllByRole('link').map((link) => link.getAttribute('href')))
    expect([...targets].sort()).toEqual(['/home', '/settings', '/terms'])
    expect(document.body.textContent).not.toMatch(/sign up|sign in|log in|register|onboarding/i)
  })

  it('lists AI coaching, speaking assessments and recommendations as planned, not available', () => {
    renderLanding()
    const planned = screen.getByRole('heading', { name: en.landing.status.plannedTitle }).parentElement as HTMLElement
    const available = screen.getByRole('heading', { name: en.landing.status.availableTitle }).parentElement as HTMLElement
    for (const feature of [
      en.landing.status.planned.coaching,
      en.landing.status.planned.speaking,
      en.landing.status.planned.recommendations,
    ]) {
      expect(within(planned).getByText(feature)).toBeTruthy()
      expect(within(available).queryByText(feature)).toBeNull()
    }
  })

  it('claims only features that exist today: no AI, certificates or accounts', () => {
    renderLanding()
    const available = screen.getByRole('heading', { name: en.landing.status.availableTitle }).parentElement as HTMLElement
    expect(available.textContent).not.toMatch(/\bAI\b|artificial intelligence|certificate|account|sign[- ]?in|log[- ]?in|assessment|recommendation/i)
  })

  it('explains local storage and points to deletion in Settings', () => {
    renderLanding()
    expect(screen.getByText(en.landing.privacy.body)).toBeTruthy()
    expect(screen.getByRole('link', { name: en.landing.privacy.settingsLink }).getAttribute('href')).toBe('/settings')
  })

  it('follows the interface language', async () => {
    renderLanding()
    await act(() => i18n.changeLanguage('ru'))
    expect(screen.getByRole('heading', { level: 1, name: ru.landing.hero.title })).toBeTruthy()
    expect(screen.getByRole('link', { name: ru.landing.hero.primaryCta })).toBeTruthy()
  })

  it('leaves stored learner data alone and does not redirect returning learners', () => {
    const stored = JSON.stringify({ schemaVersion: 1, completions: [{ pathway: 'general-english', unitId: 'u', activityId: 'a', completedAt: 'x' }] })
    window.localStorage.setItem('mex.learner', stored)
    const router = renderLanding()
    expect(router.state.location.pathname).toBe('/')
    expect(window.localStorage.getItem('mex.learner')).toBe(stored)
  })
})
