// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack, type PathwayId } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import { withOnboardingProfile } from '../learner/profile.ts'
import type { ActivityCompletion, LearnerStore } from '../learner/types.ts'
import { session, withSessions } from '../learner/readinessTestData.ts'
import HomePage from './HomePage.tsx'

const home = en.home

function memoryStorage(): Storage {
  const map = new Map<string, string>()
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

function storeWith(pathway: PathwayId, completions: ActivityCompletion[] = []): LearnerStore {
  const store = createLocalLearnerStore({ storage: memoryStorage() })
  store.update((current) => ({
    ...withOnboardingProfile(
      current,
      { interfaceLanguage: 'en', level: 'elementary', goals: ['work'], pathway },
      '2026-10-01T00:00:00.000Z',
    ),
    completions,
  }))
  return store
}

function renderHome(store: LearnerStore) {
  render(
    <LearnerProvider store={store}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </LearnerProvider>,
  )
  return store
}

function block(name: string) {
  const element = document.querySelector<HTMLElement>(`[data-block="${name}"]`)
  if (!element) throw new Error(`No ${name} block`)
  return within(element)
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('HomePage', () => {
  it('shows the four blocks in the confirmed order', async () => {
    renderHome(storeWith('general-english'))
    await screen.findByText(home.mission.why)
    const order = [...document.querySelectorAll('[data-block]')].map((element) => element.getAttribute('data-block'))
    expect(order).toEqual(['mission', 'readiness', 'pathway', 'next'])
    const headings = screen.getAllByRole('heading', { level: 2 }).map((element) => element.textContent)
    expect(headings).toEqual([home.mission.title, home.readiness.title, home.pathway.title, home.next.title])
  })

  it("lists the next two activities as Today's mission, linked to the activity or its unit, labelled as sample content, with no Start button", async () => {
    const pack = await loadPack('general-english')
    renderHome(storeWith('general-english'))
    await screen.findByText(home.mission.why)
    const mission = block('mission')
    const items = [...document.querySelectorAll('[data-block="mission"] [data-rule]')].map((element) => element.textContent)
    expect(items).toEqual([pack.units[0].activities[0].title, pack.units[0].activities[1].title])
    expect(mission.getByText(home.sampleContent)).toBeTruthy()
    const links = mission.getAllByRole('link')
    // The first activity is a lesson (player since MVP-09) and the second an exercise (MVP-10).
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      `/learn/general-english/${pack.units[0].id}/${pack.units[0].activities[0].id}`,
      `/learn/general-english/${pack.units[0].id}/${pack.units[0].activities[1].id}`,
    ])
    expect(mission.queryByText(home.mission.noPlayer)).toBeNull()
    expect(mission.queryAllByRole('button')).toHaveLength(0)
    expect(mission.getByText(home.mission.why).closest('details')).toBeTruthy()
    expect(mission.getByText(home.mission.whyBody)).toBeTruthy()
  })

  it('explains each mission item with the rule that chose it, and shows the total time', async () => {
    const pack = await loadPack('general-english')
    const [first, second] = pack.units[0].activities
    renderHome(storeWith('general-english'))
    await screen.findByText(home.mission.why)
    const mission = block('mission')
    expect(mission.getByText(`About ${first.estimatedMinutes + second.estimatedMinutes} minutes in total`)).toBeTruthy()
    const why = [...document.querySelectorAll('[data-block="mission"] [data-why] li')].map((item) => item.textContent)
    expect(why).toEqual([`${first.title}: the next activity in Unit 1.`, `${second.title}: the next activity in Unit 1.`])
    expect(mission.getByText(home.mission.whyBody)).toBeTruthy()
  })

  it('adds interview practice for a Career Readiness learner whose last session was over 7 days ago', async () => {
    const pack = await loadPack('career-readiness')
    const [lesson, exercises] = pack.units[0].activities
    const interview = pack.units[0].activities.find((activity) => activity.type === 'interview-practice')!
    const store = storeWith('career-readiness', [{ pathway: 'career-readiness', unitId: pack.units[0].id, activityId: lesson.id, completedAt: 't' }])
    const finishedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    store.update((current) => ({ ...current, practiceSessions: [{ id: 's1', kind: 'interview', pathway: 'career-readiness', activityId: interview.id, finishedAt }] }))
    renderHome(store)
    await screen.findByText(home.mission.why)
    const why = [...document.querySelectorAll('[data-block="mission"] [data-why] li')].map((item) => item.textContent)
    expect(why).toEqual([
      `${exercises.title}: the next activity in Unit 1.`,
      `${interview.title}: you have not done interview practice in the last 7 days.`,
    ])
  })

  it('suggests repeating the lowest-scored activity once everything is finished', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    const reading = unit.activities.find((activity) => activity.type === 'reading')!
    const store = storeWith('general-english', unit.activities.map((activity) => ({ pathway: 'general-english', unitId: unit.id, activityId: activity.id, completedAt: 't' })))
    store.update((current) => ({
      ...current,
      exerciseResults: [
        { pathway: 'general-english', activityId: reading.id, itemId: 'q1', skills: ['reading'], correct: false, answeredAt: 't' },
        { pathway: 'general-english', activityId: reading.id, itemId: 'q2', skills: ['reading'], correct: true, answeredAt: 't' },
      ],
    }))
    renderHome(store)
    await screen.findByText(home.mission.why)
    expect(block('mission').getByRole('link', { name: reading.title }).getAttribute('href')).toBe(`/learn/general-english/${unit.id}/${reading.id}`)
    expect(block('mission').getByText(`${reading.title}: you have finished everything, and this is where your exercise score is lowest (1 of 2 right).`)).toBeTruthy()
    expect(block('next').getByText(home.next.none)).toBeTruthy()
  })

  it('shows Getting started for a new Career Readiness learner, with a link to Progress', async () => {
    renderHome(storeWith('career-readiness'))
    await screen.findByText(home.mission.why)
    const readiness = block('readiness')
    expect(readiness.getByText(home.readiness.label)).toBeTruthy()
    expect(readiness.getByText(en.readiness.levels.gettingStarted)).toBeTruthy()
    expect(readiness.getByText(home.readiness.careerEmpty)).toBeTruthy()
    const link = readiness.getByRole('link', { name: home.readiness.seeProgress })
    expect(link.getAttribute('href')).toBe('/progress')
    expect(link.className).not.toContain('bg-accent')
  })

  it('shows the level from finished interview sessions, and Highest reached only when higher', async () => {
    const store = storeWith('career-readiness')
    store.update((current) => withSessions([session(5, 3), session(5, 3), session(5, 3), session(5, 3)], current))
    renderHome(store)
    await screen.findByText(home.mission.why)
    expect(block('readiness').getByText(en.readiness.levels.confident)).toBeTruthy()
    expect(block('readiness').getByText('Based on your finished interview practice sessions: 4. This is your own view, not a test result.')).toBeTruthy()
    expect(document.querySelector('[data-block="readiness"] [data-highest]')).toBeNull()

    act(() => {
      store.update((current) => withSessions([session(5, 3), session(5, 3), session(5, 3), session(5, 3), session(1, 0)], { ...current, selfAssessments: [], practiceSessions: [] }))
    })
    expect(block('readiness').getByText(en.readiness.levels.building)).toBeTruthy()
    expect(block('readiness').getByText('Highest reached: Confident')).toBeTruthy()
  })

  it('keeps the General English message, and General English learners see no level', async () => {
    const store = storeWith('general-english')
    store.update((current) => withSessions([session(5, 3), session(5, 3)], current))
    renderHome(store)
    await screen.findByText(home.mission.why)
    const readiness = block('readiness')
    expect(readiness.getByText(home.readiness.label)).toBeTruthy()
    const text = readiness.getByText(/Readiness is part of/).textContent
    expect(text).toBe(
      'Readiness is part of the Career Readiness pathway. Your General English progress does not count towards it.',
    )
    expect(document.querySelector('[data-block="readiness"]')?.textContent).not.toMatch(/\d/)
    expect(readiness.queryAllByRole('button')).toHaveLength(0)
    expect(readiness.queryAllByRole('link')).toHaveLength(0)
  })

  it('shows the current unit and the completed count from saved data', async () => {
    const pack = await loadPack('general-english')
    const first = pack.units[0]
    renderHome(
      storeWith('general-english', [
        { pathway: 'general-english', unitId: first.id, activityId: first.activities[0].id, completedAt: '2026-10-02T00:00:00.000Z' },
      ]),
    )
    await screen.findByText(home.mission.why)
    const pathway = block('pathway')
    expect(pathway.getByText('General English')).toBeTruthy()
    expect(pathway.getByText(`Unit 1: ${first.title}`)).toBeTruthy()
    expect(pathway.getByText(`1 of ${first.activities.length} activities completed`)).toBeTruthy()
    expect(document.querySelector('[data-block="mission"] [data-rule]')?.textContent).toBe(first.activities[1].title)
    expect(block('next').getByText(`After today's mission: ${first.activities[3].title}`)).toBeTruthy()
  })

  it('names the next event as plain text', async () => {
    const pack = await loadPack('general-english')
    renderHome(storeWith('general-english'))
    await screen.findByText(home.mission.why)
    const next = block('next')
    expect(next.getByText(`After today's mission: ${pack.units[0].activities[2].title}`)).toBeTruthy()
    expect(next.queryByRole('button')).toBeNull()
    expect(next.queryByRole('link')).toBeNull()
  })

  it('switches the pathway only after confirmation and keeps all progress', async () => {
    const completions: ActivityCompletion[] = [
      { pathway: 'general-english', unitId: 'u', activityId: 'ge-01-a1-lesson', completedAt: '2026-10-02T00:00:00.000Z' },
    ]
    const store = renderHome(storeWith('general-english', completions))
    await screen.findByText(home.mission.why)

    fireEvent.click(screen.getByRole('button', { name: home.pathway.switch }))
    expect(screen.getByText('Switch to Career Readiness? Your progress in both pathways is kept.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: home.pathway.cancel }))
    expect(store.read().profile?.pathway).toBe('general-english')
    expect(document.activeElement?.textContent).toBe(home.pathway.switch)

    fireEvent.click(screen.getByRole('button', { name: home.pathway.switch }))
    fireEvent.click(screen.getByRole('button', { name: home.pathway.confirmYes }))
    const record = store.read()
    expect(record.profile?.pathway).toBe('career-readiness')
    expect(record.profile?.createdAt).toBe('2026-10-01T00:00:00.000Z')
    expect(record.profile?.goals).toEqual(['work'])
    expect(record.completions).toEqual(completions)
    expect(document.activeElement?.textContent).toBe(home.pathway.switch)

    const career = await loadPack('career-readiness')
    expect(await screen.findByText(career.units[0].activities[0].title)).toBeTruthy()
    expect(block('pathway').getByText('Career Readiness')).toBeTruthy()
    expect(block('pathway').getByText(`0 of ${career.units[0].activities.length} activities completed`)).toBeTruthy()
    expect(block('readiness').getByText(home.readiness.careerEmpty)).toBeTruthy()
  })

  it('writes nothing just by being opened', async () => {
    const store = storeWith('general-english')
    const before = JSON.stringify(store.read())
    renderHome(store)
    await screen.findByText(home.mission.why)
    expect(JSON.stringify(store.read())).toBe(before)
  })

  it('updates at once when the language changes', async () => {
    renderHome(storeWith('general-english'))
    await screen.findByText(home.mission.why)
    await act(() => i18n.changeLanguage('ru'))
    expect(screen.getByRole('heading', { name: ru.home.mission.title })).toBeTruthy()
    expect(screen.getByText(ru.home.readiness.label)).toBeTruthy()
    expect(screen.getByText('Готовность относится к направлению «Подготовка к карьере». Прогресс в направлении «Общий английский» в неё не засчитывается.')).toBeTruthy()
  })
})
