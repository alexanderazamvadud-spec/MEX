import { describe, expect, it } from 'vitest'
import { explanationsOn, withCompletion, withNativeExplanations } from './lesson.ts'
import { withOnboardingProfile } from './profile.ts'
import { createEmptyRecord, type LearnerRecord } from './types.ts'

function recordFor(level: 'beginner' | 'elementary' | 'intermediate'): LearnerRecord {
  return withOnboardingProfile(
    createEmptyRecord(),
    { interfaceLanguage: 'uz', level, goals: ['work'], pathway: 'general-english' },
    '2026-10-01T00:00:00.000Z',
  )
}

describe('native-language explanations', () => {
  it('defaults to on for Beginner and off for other levels', () => {
    expect(explanationsOn(recordFor('beginner'))).toBe(true)
    expect(explanationsOn(recordFor('elementary'))).toBe(false)
    expect(explanationsOn(recordFor('intermediate'))).toBe(false)
    expect(explanationsOn(createEmptyRecord())).toBe(false)
  })

  it("follows the learner's own choice once made", () => {
    expect(explanationsOn(withNativeExplanations(recordFor('beginner'), false))).toBe(false)
    expect(explanationsOn(withNativeExplanations(recordFor('intermediate'), true))).toBe(true)
  })

  it('changes only the preference', () => {
    const before = recordFor('beginner')
    const after = withNativeExplanations(before, false)
    expect({ ...after, preferences: before.preferences }).toEqual(before)
  })
})

describe('lesson completion', () => {
  const lesson = { pathway: 'general-english' as const, unitId: 'u1', activityId: 'a1' }

  it('records a completion once and keeps the first date', () => {
    const once = withCompletion(recordFor('beginner'), lesson, '2026-10-17T10:00:00.000Z')
    expect(once.completions).toEqual([{ ...lesson, completedAt: '2026-10-17T10:00:00.000Z' }])
    const twice = withCompletion(once, lesson, '2026-10-18T10:00:00.000Z')
    expect(twice).toBe(once)
  })

  it('keeps completions of the same id in another pathway separate', () => {
    const ge = withCompletion(recordFor('beginner'), lesson, '2026-10-17T10:00:00.000Z')
    const both = withCompletion(ge, { ...lesson, pathway: 'career-readiness' }, '2026-10-17T11:00:00.000Z')
    expect(both.completions).toHaveLength(2)
  })
})
