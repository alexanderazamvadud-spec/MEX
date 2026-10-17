// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import { renderAt, storeWith } from './learnTestUtils.tsx'

const learn = en.learn

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('Pathways hub', () => {
  it('shows both pathways as equal cards and labels only the active one', () => {
    renderAt('/learn', storeWith('career-readiness'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en.nav.learn)
    expect(screen.getByText(learn.intro)).toBeTruthy()
    const cards = document.querySelectorAll<HTMLElement>('[data-pathway]')
    expect([...cards].map((card) => card.dataset.pathway)).toEqual(['general-english', 'career-readiness'])
    expect([...cards].map((card) => card.querySelector('h2')?.textContent)).toEqual(['General English', 'Career Readiness'])
    expect([...cards].map((card) => card.querySelector('a')?.className)).toEqual([
      cards[1].querySelector('a')?.className,
      cards[1].querySelector('a')?.className,
    ])
    expect(within(cards[0]).queryByText(learn.current)).toBeNull()
    expect(within(cards[1]).getByText(learn.current)).toBeTruthy()
    expect(within(cards[0]).getByRole('link').getAttribute('href')).toBe('/learn/general-english')
  })

  it('opens a pathway overview without switching pathway', async () => {
    const store = storeWith('career-readiness')
    const router = renderAt('/learn', store)
    fireEvent.click(within(document.querySelector('[data-pathway="general-english"]')!).getByRole('link'))
    expect(router.state.location.pathname).toBe('/learn/general-english')
    await screen.findByText(learn.units)
    expect(store.read().profile?.pathway).toBe('career-readiness')
  })
})

describe('Pathway overview', () => {
  it('lists the units with status and completion from saved data', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    renderAt(
      '/learn/general-english',
      storeWith('general-english', [
        { pathway: 'general-english', unitId: unit.id, activityId: unit.activities[0].id, completedAt: '2026-10-02T00:00:00.000Z' },
      ]),
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('General English')
    await screen.findByText(pack.description.en)
    expect(screen.getByText(learn.current)).toBeTruthy()
    expect(screen.getByText(en.home.sampleContent)).toBeTruthy()
    const rows = document.querySelectorAll('[data-unit]')
    expect(rows).toHaveLength(pack.units.length)
    const row = within(rows[0] as HTMLElement)
    expect(row.getByRole('heading', { level: 3 }).textContent).toBe(`Unit 1: ${unit.title}`)
    expect(row.getByText(unit.summary.en)).toBeTruthy()
    expect(row.getByText(`1 of ${unit.activities.length} activities completed`)).toBeTruthy()
    expect(row.getByText(learn.status.inProgress)).toBeTruthy()
    expect(row.getByRole('link').getAttribute('href')).toBe(`/learn/general-english/${unit.id}`)
    expect(screen.getByRole('link', { name: learn.back }).getAttribute('href')).toBe('/learn')
    expect(document.body.textContent).not.toMatch(/elementary|\b[ABC][12]\b/i)
  })

  it('shows Not started for an untouched pathway and does not label it current', async () => {
    renderAt('/learn/career-readiness', storeWith('general-english'))
    await screen.findByText(learn.status.notStarted)
    expect(screen.queryByText(learn.current)).toBeNull()
  })

  it('shows Not found for an unknown pathway', () => {
    renderAt('/learn/mining', storeWith('general-english'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en.notFound.title)
  })
})

describe('Unit overview', () => {
  it('lists activities with type, minutes, completion, mission and Opens soon labels', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    const [first, second, third] = unit.activities
    renderAt(
      `/learn/general-english/${unit.id}`,
      storeWith('general-english', [
        { pathway: 'general-english', unitId: unit.id, activityId: first.id, completedAt: '2026-10-02T00:00:00.000Z' },
      ]),
    )
    await screen.findByText(learn.activities)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(`Unit 1: ${unit.title}`)
    expect(screen.getByRole('link', { name: learn.back }).getAttribute('href')).toBe('/learn/general-english')

    const row = (id: string) => within(document.querySelector<HTMLElement>(`[data-activity="${id}"]`)!)
    expect(row(first.id).getByText(first.title)).toBeTruthy()
    expect(row(first.id).getByText(`${learn.types.lesson} · About ${first.estimatedMinutes} min`)).toBeTruthy()
    expect(row(first.id).getByText(learn.done)).toBeTruthy()
    expect(row(first.id).queryByText(learn.mission)).toBeNull()
    expect(row(second.id).getByText(learn.mission)).toBeTruthy()
    expect(row(third.id).getByText(learn.mission)).toBeTruthy()
    for (const activity of unit.activities) {
      expect(row(activity.id).getByText(learn.opensSoon)).toBeTruthy()
      expect(row(activity.id).queryByRole('link')).toBeNull()
    }
    expect(screen.getByText(en.home.mission.noPlayer)).toBeTruthy()
  })

  it("shows no Today's mission label when browsing the other pathway", async () => {
    const pack = await loadPack('career-readiness')
    renderAt(`/learn/career-readiness/${pack.units[0].id}`, storeWith('general-english'))
    await screen.findByText(learn.activities)
    expect(screen.queryByText(learn.mission)).toBeNull()
  })

  it('shows Not found for an unknown unit', async () => {
    renderAt('/learn/general-english/no-such-unit', storeWith('general-english'))
    expect(await screen.findByRole('heading', { name: en.notFound.title })).toBeTruthy()
  })

  it('writes no learner data', async () => {
    const pack = await loadPack('general-english')
    const store = storeWith('general-english')
    const before = JSON.stringify(store.read())
    renderAt(`/learn/general-english/${pack.units[0].id}`, store)
    await screen.findByText(learn.activities)
    expect(JSON.stringify(store.read())).toBe(before)
  })

  it('updates at once when the language changes, keeping English titles', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    renderAt(`/learn/general-english/${unit.id}`, storeWith('general-english'))
    await screen.findByText(learn.activities)
    await act(() => i18n.changeLanguage('ru'))
    expect(screen.getByRole('heading', { name: ru.learn.activities })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(`Раздел 1: ${unit.title}`)
    expect(screen.getByText(unit.summary.ru!)).toBeTruthy()
    expect(screen.getAllByText(ru.learn.opensSoon)).toHaveLength(unit.activities.length)
  })
})

describe("Today's mission on Home", () => {
  it('links each mission activity to its unit overview', async () => {
    const pack = await loadPack('general-english')
    const router = renderAt('/home', storeWith('general-english'))
    const link = await screen.findByRole('link', { name: pack.units[0].activities[0].title })
    fireEvent.click(link)
    expect(router.state.location.pathname).toBe(`/learn/general-english/${pack.units[0].id}`)
    expect(await screen.findByText(learn.activities)).toBeTruthy()
  })
})
