// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPack, type PathwayId } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import uz from '../i18n/locales/uz.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { session, withSessions } from '../learner/readinessTestData.ts'
import type { LearnerRecord, LearnerStore } from '../learner/types.ts'
import { storeWith } from './learnTestUtils.tsx'
import ProgressPage from './ProgressPage.tsx'

const text = en.progress

function renderProgress(store: LearnerStore) {
  render(
    <LearnerProvider store={store}>
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    </LearnerProvider>,
  )
}

function storeAt(pathway: PathwayId, change: (record: LearnerRecord) => LearnerRecord = (record) => record) {
  const store = storeWith(pathway)
  store.update(change)
  return store
}

const layer = (name: string) => within(document.querySelector<HTMLElement>(`[data-layer="${name}"]`)!)

async function loaded() {
  await screen.findAllByText(/activities completed/)
  await screen.findByText(/^0 of \d+ activities completed$|^\d+ of \d+ activities completed$/, { selector: '[data-pathway="career-readiness"] p' })
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('ProgressPage', () => {
  it('shows the three layers as separate sections, with only readiness labelled Self-assessment', async () => {
    const [general, career] = await Promise.all([loadPack('general-english'), loadPack('career-readiness')])
    renderProgress(storeAt('career-readiness'))
    await loaded()
    expect(screen.getByRole('heading', { level: 1, name: en.nav.progress })).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      text.curriculum.title,
      text.skills.title,
      text.readiness.title,
    ])
    expect(screen.getAllByText(en.home.readiness.label)).toHaveLength(1)
    expect(layer('readiness').getByText(en.home.readiness.label)).toBeTruthy()

    // Curriculum: the current pathway first, nothing finished yet.
    const pathways = [...document.querySelectorAll('[data-pathway]')].map((element) => element.getAttribute('data-pathway'))
    expect(pathways).toEqual(['career-readiness', 'general-english'])
    const count = (pack: typeof general) => pack.units.flatMap((unit) => unit.activities).length
    expect(layer('curriculum').getByText(`0 of ${count(career)} activities completed`)).toBeTruthy()
    expect(layer('curriculum').getByText(`0 of ${count(general)} activities completed`)).toBeTruthy()

    // Skills: the four checked skills only, none practised.
    expect(layer('skills').getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Vocabulary', 'Grammar', 'Reading', 'Listening'])
    expect(layer('skills').getAllByText(text.skills.none)).toHaveLength(4)
    expect(layer('skills').queryByText(/Speaking|Writing/)).toBeNull()

    // Readiness: Getting started, explained in one sentence.
    const readiness = layer('readiness')
    expect(readiness.getByText(en.readiness.levels.gettingStarted)).toBeTruthy()
    expect(readiness.getByText(en.readiness.how)).toBeTruthy()
    expect(readiness.getByText(en.readiness.ownView)).toBeTruthy()
    expect(readiness.getByText('Highest reached: Getting started')).toBeTruthy()
    expect(readiness.getByText('Interview practice sessions finished: 0')).toBeTruthy()
    expect(readiness.getByText('Speaking practice in Career Readiness: 0 done')).toBeTruthy()
    expect(readiness.getByText(en.readiness.speakingNote)).toBeTruthy()

    // Read-only: no saffron action and no buttons.
    expect(document.querySelector('.bg-accent')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('counts finished activities and checked answers, which never change readiness', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    const store = storeAt('general-english', (record) => ({
      ...record,
      completions: unit.activities.map((activity) => ({ pathway: 'general-english', unitId: unit.id, activityId: activity.id, completedAt: 't' })),
      exerciseResults: [
        { pathway: 'general-english', activityId: 'a', itemId: 'q1', skills: ['grammar'], correct: true, answeredAt: 't1' },
        { pathway: 'general-english', activityId: 'a', itemId: 'q2', skills: ['grammar', 'vocabulary'], correct: false, answeredAt: 't1' },
        { pathway: 'career-readiness', activityId: 'b', itemId: 'q1', skills: ['vocabulary'], correct: true, answeredAt: 't1' },
      ],
    }))
    renderProgress(store)
    await loaded()
    const general = within(document.querySelector<HTMLElement>('[data-pathway="general-english"]')!)
    expect(general.getByText(`${unit.activities.length} of ${pack.units.flatMap((item) => item.activities).length} activities completed`)).toBeTruthy()
    expect(general.getByText(`1 of ${pack.units.length} units completed`)).toBeTruthy()
    expect(within(document.querySelector<HTMLElement>('[data-skill="grammar"]')!).getByText('1 of 2 questions right')).toBeTruthy()
    expect(within(document.querySelector<HTMLElement>('[data-skill="vocabulary"]')!).getByText('1 of 2 questions right')).toBeTruthy()
    expect(layer('readiness').getByText(en.readiness.levels.gettingStarted)).toBeTruthy()
  })

  it('shows a lower current level with Highest reached kept, and the recent evidence', async () => {
    const store = storeAt('career-readiness', (record) =>
      withSessions([session(5, 3), session(5, 3), session(5, 3), session(5, 3), session(1, 0)], record),
    )
    renderProgress(store)
    await loaded()
    const readiness = layer('readiness')
    expect(readiness.getByText(en.readiness.levels.building)).toBeTruthy()
    expect(readiness.getByText('Highest reached: Confident, on 4 October 2026')).toBeTruthy()
    expect(readiness.getByText('Interview practice sessions finished: 5')).toBeTruthy()
    // 11/3 = 3.67 is shown rounded down, so it never looks like the threshold of 4.
    expect(readiness.getByText('Average confidence in your recent sessions: 3.6 of 5')).toBeTruthy()
    expect(readiness.getByText('Self-check boxes ticked in your recent sessions: 18 of 27')).toBeTruthy()
  })

  it('says when recent sessions have no confidence ratings', async () => {
    renderProgress(storeAt('career-readiness', (record) => withSessions([session(null, 2)], record)))
    await loaded()
    expect(layer('readiness').getByText(en.readiness.notRated)).toBeTruthy()
  })

  it('is translated, with the level names in Uzbek', async () => {
    await act(() => i18n.changeLanguage('uz'))
    renderProgress(storeAt('career-readiness', (record) => withSessions([session(5, 3), session(5, 3)], record)))
    await screen.findAllByText(/mashgʻulotdan/)
    expect(screen.getByRole('heading', { level: 2, name: uz.progress.readiness.title })).toBeTruthy()
    expect(layer('readiness').getByText(uz.readiness.levels.building)).toBeTruthy()
    expect(layer('readiness').getByText(uz.home.readiness.label)).toBeTruthy()
  })
})
