import { describe, expect, it } from 'vitest'
import type { Activity, ActivityType, ContentPack, PathwayId, Unit } from '../content/index.ts'
import { activityScores, interviewDue, lowestScore, MISSION_PILOT_SETTINGS, planMission, totalMinutes, type MissionInput } from './mission.ts'
import type { ActivityCompletion, ExerciseResult, PracticeSession } from './types.ts'

const NOW = '2026-10-19T12:00:00.000Z'
const HOUR = 60 * 60 * 1000

function activity(id: string, type: ActivityType, minutes: number): Activity {
  return { id, type, title: `Title ${id}`, instructions: { en: '' }, skills: [], estimatedMinutes: minutes, items: [] }
}

function unit(id: string, activities: Activity[]): Unit {
  return { id, title: `Unit ${id}`, summary: { en: '' }, estimatedMinutes: 40, activities }
}

function pack(pathway: PathwayId, units: Unit[]): ContentPack {
  return { id: pathway, pathway, title: '', description: { en: '' }, level: 'elementary', content_status: 'placeholder', license: 'placeholder', units }
}

// Career Readiness shaped like the real pack: lesson 10, exercises 8, speaking 8, interview 14.
const career = pack('career-readiness', [
  unit('c1', [activity('l1', 'lesson', 10), activity('e1', 'exercise', 8), activity('s1', 'speaking', 8), activity('i1', 'interview-practice', 14)]),
  unit('c2', [activity('l2', 'lesson', 10), activity('e2', 'exercise', 8), activity('r2', 'reading', 6)]),
])
const general = pack('general-english', [
  unit('g1', [activity('gl', 'lesson', 10), activity('ge', 'exercise', 8), activity('gr', 'reading', 8), activity('gs', 'listening', 6)]),
])

const done = (target: ContentPack, ids: string[]): ActivityCompletion[] =>
  ids.map((activityId) => ({ pathway: target.pathway, unitId: 'x', activityId, completedAt: '2026-10-01T00:00:00.000Z' }))
const allIds = (target: ContentPack) => target.units.flatMap((item) => item.activities.map((entry) => entry.id))
const sessionAt = (ms: number): PracticeSession => ({ id: `s-${ms}`, kind: 'interview', pathway: 'career-readiness', activityId: 'i1', finishedAt: new Date(ms).toISOString() })
const ago = (hours: number) => sessionAt(Date.parse(NOW) - hours * HOUR)
const result = (pathway: PathwayId, activityId: string, itemId: string, correct: boolean, answeredAt = 't1'): ExerciseResult => ({ pathway, activityId, itemId, skills: ['grammar'], correct, answeredAt })

const plan = (input: Omit<MissionInput, 'now'>) => planMission({ now: NOW, ...input })
const summary = (input: Omit<MissionInput, 'now'>) => plan(input).items.map((item) => [item.activity.id, item.reason.rule])

describe('mission pilot settings', () => {
  it('are the values the owner approved on 2026-10-19', () => {
    expect(MISSION_PILOT_SETTINGS).toEqual({ maxItems: 2, maxMinutes: 20, interviewGapDays: 7 })
  })
})

describe('default rule', () => {
  it('gives the next two unfinished activities of the current unit when they fit in 20 minutes', () => {
    const mission = plan({ pack: career, completions: [] })
    expect(summary({ pack: career, completions: [] })).toEqual([['l1', 'next'], ['e1', 'next']])
    expect(totalMinutes(mission.items)).toBe(18)
    expect(mission.items[0].reason).toEqual({ rule: 'next', unit: 1 })
    expect(mission.nextEvent?.id).toBe('s1')
  })

  it('adds the second item at exactly 20 minutes but not at 21', () => {
    const twenty = pack('general-english', [unit('u', [activity('a', 'lesson', 12), activity('b', 'exercise', 8)])])
    const twentyOne = pack('general-english', [unit('u', [activity('a', 'lesson', 12), activity('b', 'exercise', 9)])])
    expect(summary({ pack: twenty, completions: [] })).toEqual([['a', 'next'], ['b', 'next']])
    expect(summary({ pack: twentyOne, completions: [] })).toEqual([['a', 'next']])
    expect(plan({ pack: twentyOne, completions: [] }).nextEvent?.id).toBe('b')
  })

  it('always includes the first item, even when it alone is longer than 20 minutes', () => {
    const long = pack('general-english', [unit('u', [activity('a', 'lesson', 25), activity('b', 'exercise', 5)])])
    expect(summary({ pack: long, completions: [] })).toEqual([['a', 'next']])
  })

  it('keeps speaking alone when speaking and interview practice would take 22 minutes', () => {
    expect(summary({ pack: career, completions: done(career, ['l1', 'e1']) })).toEqual([['s1', 'next']])
  })
})

describe('interview rule (Career Readiness)', () => {
  const started = done(career, ['l1'])

  it('does not apply before the first finished interview session', () => {
    expect(interviewDue([], NOW)).toBe(false)
    expect(summary({ pack: career, completions: started, practiceSessions: [] })).toEqual([['e1', 'next'], ['s1', 'next']])
  })

  it('applies exactly 7 days after the last session, not 6 days and 23 hours after', () => {
    expect(interviewDue([ago(7 * 24)], NOW)).toBe(true)
    expect(interviewDue([ago(7 * 24 - 1)], NOW)).toBe(false)
    expect(interviewDue([ago(30 * 24), ago(2 * 24)], NOW)).toBe(false)
    expect(summary({ pack: career, completions: started, practiceSessions: [ago(7 * 24 - 1)] })).toEqual([['e1', 'next'], ['s1', 'next']])
  })

  it('takes the second slot, even beyond 20 minutes', () => {
    const mission = plan({ pack: career, completions: started, practiceSessions: [ago(8 * 24)] })
    expect(mission.items.map((item) => [item.activity.id, item.reason.rule])).toEqual([['e1', 'next'], ['i1', 'interview']])
    expect(totalMinutes(mission.items)).toBe(22)
    expect(mission.nextEvent?.id).toBe('s1')
  })

  it('changes nothing when interview practice is already in the mission', () => {
    expect(summary({ pack: career, completions: done(career, ['l1', 'e1', 's1']), practiceSessions: [ago(8 * 24)] })).toEqual([['i1', 'next']])
  })

  it('uses the interview activity of the nearest earlier unit when the current unit has none', () => {
    const completions = done(career, ['l1', 'e1', 's1', 'i1', 'l2'])
    expect(summary({ pack: career, completions, practiceSessions: [ago(8 * 24)] })).toEqual([['e2', 'next'], ['i1', 'interview']])
  })

  it('never applies to General English', () => {
    expect(summary({ pack: general, completions: [], practiceSessions: [ago(30 * 24)] })).toEqual([['gl', 'next'], ['ge', 'next']])
  })
})

describe('next-unit rule', () => {
  it('starts an untouched next unit with its first activity only', () => {
    const mission = plan({ pack: career, completions: done(career, ['l1', 'e1', 's1', 'i1']) })
    expect(mission.items.map((item) => [item.activity.id, item.unitId])).toEqual([['l2', 'c2']])
    expect(mission.items[0].reason).toEqual({ rule: 'nextUnit', finished: 1, unit: 2 })
    expect(mission.nextEvent?.id).toBe('e2')
  })

  it('goes back to the default rule once the next unit is started', () => {
    expect(summary({ pack: career, completions: done(career, ['l1', 'e1', 's1', 'i1', 'e2']) })).toEqual([['l2', 'next'], ['r2', 'next']])
  })

  it('still adds interview practice when it is due', () => {
    expect(summary({ pack: career, completions: done(career, ['l1', 'e1', 's1', 'i1']), practiceSessions: [ago(8 * 24)] })).toEqual([['l2', 'nextUnit'], ['i1', 'interview']])
  })
})

describe('repeat rule (everything finished)', () => {
  const everything = done(general, allIds(general))

  it('suggests the scored activity with the lowest score, from the latest answers', () => {
    const exerciseResults = [
      result('general-english', 'ge', 'q1', false, 't1'),
      result('general-english', 'ge', 'q1', true, 't2'),
      result('general-english', 'ge', 'q2', true),
      result('general-english', 'gr', 'q1', true),
      result('general-english', 'gr', 'q2', false),
      result('general-english', 'gs', 'q1', true),
    ]
    const mission = plan({ pack: general, completions: everything, exerciseResults })
    expect(mission.items.map((item) => [item.activity.id, item.reason])).toEqual([['gr', { rule: 'repeat', right: 1, total: 2 }]])
    expect(mission.nextEvent).toBeNull()
  })

  it('breaks ties by pathway order, and never picks a lesson or results from the other pathway', () => {
    const exerciseResults = [
      result('general-english', 'gr', 'q1', false),
      result('general-english', 'ge', 'q1', false),
      result('career-readiness', 'gs', 'q1', false),
      result('general-english', 'gs', 'q1', true),
    ]
    expect(summary({ pack: general, completions: everything, exerciseResults })).toEqual([['ge', 'repeat']])
    expect(activityScores(general, exerciseResults).map((score) => score.activity.id)).toEqual(['ge', 'gr', 'gs'])
  })

  it('still picks the first activity when every score is full marks', () => {
    const exerciseResults = ['ge', 'gr', 'gs'].map((id) => result('general-english', id, 'q1', true))
    expect(lowestScore(activityScores(general, exerciseResults))).toMatchObject({ activity: { id: 'ge' }, right: 1, total: 1 })
  })

  it('adds interview practice for Career Readiness when it is due', () => {
    const exerciseResults = [result('career-readiness', 'e2', 'q1', false)]
    expect(summary({ pack: career, completions: done(career, allIds(career)), exerciseResults, practiceSessions: [ago(8 * 24)] })).toEqual([['e2', 'repeat'], ['i1', 'interview']])
  })

  it('gives an empty mission when nothing has a score', () => {
    expect(plan({ pack: general, completions: everything })).toEqual({ items: [], nextEvent: null })
  })
})
