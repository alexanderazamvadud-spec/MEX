import { describe, expect, it } from 'vitest'
import { GOALS, answersFromProfile, isComplete, withOnboardingProfile } from './profile.ts'
import { createEmptyRecord, type LearnerRecord } from './types.ts'

const now = '2026-10-17T10:00:00.000Z'
const later = '2026-10-18T09:00:00.000Z'

describe('withOnboardingProfile', () => {
  it('sets the profile from the answers and keeps goals in display order', () => {
    const record = withOnboardingProfile(
      createEmptyRecord(),
      { interfaceLanguage: 'uz', level: 'beginner', goals: ['work', 'everyday'], pathway: 'career-readiness' },
      now,
    )
    expect(record.profile).toEqual({
      interfaceLanguage: 'uz',
      level: 'beginner',
      goals: ['everyday', 'work'],
      pathway: 'career-readiness',
      createdAt: now,
      updatedAt: now,
    })
  })

  it('changes only the profile and keeps history and preferences', () => {
    const before: LearnerRecord = {
      ...createEmptyRecord(),
      preferences: { nativeExplanations: false },
      completions: [{ pathway: 'general-english', unitId: 'u', activityId: 'a', completedAt: now }],
      usefulnessRatings: [{ activityId: 'a', rating: 4, ratedAt: now }],
    }
    const after = withOnboardingProfile(
      before,
      { interfaceLanguage: 'en', level: 'elementary', goals: ['study'], pathway: 'general-english' },
      now,
    )
    expect({ ...after, profile: null }).toEqual(before)
  })

  it('keeps the original createdAt when a returning learner finishes again', () => {
    const first = withOnboardingProfile(
      createEmptyRecord(),
      { interfaceLanguage: 'en', level: 'beginner', goals: ['study'], pathway: 'general-english' },
      now,
    )
    const second = withOnboardingProfile(
      first,
      { interfaceLanguage: 'ru', level: 'intermediate', goals: ['work'], pathway: 'career-readiness' },
      later,
    )
    expect(second.profile?.createdAt).toBe(now)
    expect(second.profile?.updatedAt).toBe(later)
    expect(second.profile?.level).toBe('intermediate')
  })
})

describe('isComplete', () => {
  it('needs a level, at least one goal and a pathway', () => {
    const base = { interfaceLanguage: 'en' as const, level: 'beginner' as const, goals: GOALS.slice(0, 1), pathway: 'general-english' as const }
    expect(isComplete(base)).toBe(true)
    expect(isComplete({ ...base, level: null })).toBe(false)
    expect(isComplete({ ...base, goals: [] })).toBe(false)
    expect(isComplete({ ...base, pathway: null })).toBe(false)
  })
})

describe('answersFromProfile', () => {
  it('starts empty without a profile', () => {
    expect(answersFromProfile(null, 'en')).toEqual({ interfaceLanguage: 'en', level: null, goals: [], pathway: null })
  })
})
