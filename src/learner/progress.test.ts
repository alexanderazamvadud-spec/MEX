import { describe, expect, it } from 'vitest'
import type { Unit } from '../content/index.ts'
import { completedActivityIds, unitCompletion } from './progress.ts'

const unit: Unit = {
  id: 'u1',
  title: 'Unit',
  summary: { en: '' },
  estimatedMinutes: 10,
  activities: ['a1', 'a2', 'a3'].map((id) => ({
    id,
    type: 'lesson' as const,
    title: id,
    instructions: { en: '' },
    skills: [],
    estimatedMinutes: 5,
    items: [],
  })),
}

const at = '2026-10-17T00:00:00.000Z'

describe('curriculum completion', () => {
  it('counts only the given pathway', () => {
    const ids = completedActivityIds('general-english', [
      { pathway: 'general-english', unitId: 'u1', activityId: 'a1', completedAt: at },
      { pathway: 'career-readiness', unitId: 'u1', activityId: 'a2', completedAt: at },
    ])
    expect([...ids]).toEqual(['a1'])
  })

  it('reports not started, in progress and completed', () => {
    expect(unitCompletion(unit, new Set())).toEqual({ done: 0, total: 3, status: 'notStarted' })
    expect(unitCompletion(unit, new Set(['a2']))).toEqual({ done: 1, total: 3, status: 'inProgress' })
    expect(unitCompletion(unit, new Set(['a1', 'a2', 'a3', 'other']))).toEqual({ done: 3, total: 3, status: 'completed' })
  })
})
