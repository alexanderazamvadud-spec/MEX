import { describe, expect, it } from 'vitest'
import type { Activity, ContentPack, Unit } from '../content/index.ts'
import type { MissionItem } from './mission.ts'
import { currentUnit, fixedRuleProvider } from './home.ts'
import type { ActivityCompletion } from './types.ts'

function activity(id: string): Activity {
  return { id, type: 'lesson', title: `Title ${id}`, instructions: { en: '' }, skills: [], estimatedMinutes: 5, items: [] }
}

function unit(id: string, activityIds: string[]): Unit {
  return { id, title: `Unit ${id}`, summary: { en: '' }, estimatedMinutes: 20, activities: activityIds.map(activity) }
}

const pack: ContentPack = {
  id: 'general-english',
  pathway: 'general-english',
  title: 'General English',
  description: { en: '' },
  level: 'elementary',
  content_status: 'placeholder',
  license: 'placeholder',
  units: [unit('u1', ['a1', 'a2', 'a3', 'a4']), unit('u2', ['b1', 'b2'])],
}

function done(ids: string[], pathway: ActivityCompletion['pathway'] = 'general-english'): ActivityCompletion[] {
  return ids.map((activityId) => ({ pathway, unitId: 'x', activityId, completedAt: '2026-10-17T00:00:00.000Z' }))
}

const ids = (list: MissionItem[]) => list.map((item) => item.activity.id)

describe('Home rules', () => {
  it('starts at the first unit with nothing completed', () => {
    const progress = currentUnit({ pack, completions: [] })
    expect(progress).toMatchObject({ number: 1, done: 0, total: 4 })
    expect(progress?.unit.id).toBe('u1')
    const plan = fixedRuleProvider({ pack, completions: [] })
    expect(ids(plan.mission)).toEqual(['a1', 'a2'])
    expect(plan.nextEvent?.id).toBe('a3')
  })

  it('skips completed activities and counts them', () => {
    const completions = done(['a1', 'a3'])
    expect(currentUnit({ pack, completions })).toMatchObject({ number: 1, done: 2, total: 4 })
    const plan = fixedRuleProvider({ pack, completions })
    expect(ids(plan.mission)).toEqual(['a2', 'a4'])
    expect(plan.nextEvent?.id).toBe('b1')
  })

  it('gives a one-activity mission when only one is left in the unit', () => {
    const plan = fixedRuleProvider({ pack, completions: done(['a1', 'a2', 'a3']) })
    expect(ids(plan.mission)).toEqual(['a4'])
    expect(plan.nextEvent?.id).toBe('b1')
  })

  it('moves to the next unit when a unit is finished, starting it with its first activity (MVP-16)', () => {
    const completions = done(['a1', 'a2', 'a3', 'a4'])
    expect(currentUnit({ pack, completions })).toMatchObject({ number: 2, done: 0, total: 2 })
    const plan = fixedRuleProvider({ pack, completions })
    expect(ids(plan.mission)).toEqual(['b1'])
    expect(plan.nextEvent?.id).toBe('b2')
  })

  it('keeps the last unit and an empty mission when everything is completed', () => {
    const completions = done(['a1', 'a2', 'a3', 'a4', 'b1', 'b2'])
    expect(currentUnit({ pack, completions })).toMatchObject({ number: 2, done: 2, total: 2 })
    expect(fixedRuleProvider({ pack, completions })).toEqual({ mission: [], nextEvent: null })
  })

  it('ignores completions from the other pathway', () => {
    const completions = done(['a1', 'a2'], 'career-readiness')
    expect(currentUnit({ pack, completions })).toMatchObject({ done: 0 })
    expect(ids(fixedRuleProvider({ pack, completions }).mission)).toEqual(['a1', 'a2'])
  })

  it('handles a pack with no units', () => {
    const empty = { ...pack, units: [] }
    expect(currentUnit({ pack: empty, completions: [] })).toBeNull()
    expect(fixedRuleProvider({ pack: empty, completions: [] })).toEqual({ mission: [], nextEvent: null })
  })
})
