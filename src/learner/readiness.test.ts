import { describe, expect, it } from 'vitest'
import { levelFor, finishedInterviewSessions, readiness, READINESS_PILOT_SETTINGS } from './readiness.ts'
import { session, withSessions } from './readinessTestData.ts'
import { createEmptyRecord } from './types.ts'

const levelOf = (...specs: Parameters<typeof withSessions>[0]) => readiness(withSessions(specs)).level

describe('readiness pilot settings', () => {
  it('are the values the owner approved on 2026-10-18', () => {
    expect(READINESS_PILOT_SETTINGS).toEqual({ buildingSessions: 2, confidentSessions: 4, recentSessions: 3, confidentAverage: 4, confidentTicked: 0.75 })
  })
})

describe('readiness level', () => {
  it('is Getting started with fewer than 2 finished sessions', () => {
    expect(readiness(createEmptyRecord())).toMatchObject({ level: 'gettingStarted', sessionsFinished: 0, highest: { level: 'gettingStarted', reachedAt: null } })
    expect(levelOf(session(5, 3))).toBe('gettingStarted')
  })

  it('is Building with 2 or 3 sessions, however strong they are', () => {
    expect(levelOf(session(5, 3), session(5, 3))).toBe('building')
    expect(levelOf(session(5, 3), session(5, 3), session(5, 3))).toBe('building')
  })

  it('is Confident with 4 sessions, an average of exactly 4 and exactly 75% ticked in the 3 most recent', () => {
    // 27 boxes in 3 sessions; 75% is 20.25, so 21 ticked is enough and 20 is not.
    const seven = { confidence: [4, 4, 4], ticked: [3, 3, 1] } satisfies Parameters<typeof withSessions>[0][number]
    const six = { confidence: [4, 4, 4], ticked: [3, 3, 0] } satisfies Parameters<typeof withSessions>[0][number]
    expect(levelOf(session(1, 0), seven, seven, seven)).toBe('confident')
    expect(levelOf(session(1, 0), seven, seven, six)).toBe('building')
  })

  it('needs an average of at least 4: 3.9 is not enough', () => {
    // Nine ratings: eight 4s and one 3 average 3.89.
    expect(levelOf(session(1, 0), session(4, 3), session(4, 3), { confidence: [4, 4, 3], ticked: [3, 3, 3] })).toBe('building')
    expect(levelOf(session(1, 0), session(4, 3), session(4, 3), { confidence: [4, 4, 4], ticked: [3, 3, 3] })).toBe('confident')
  })

  it('averages only the rated questions, and cannot be Confident with no ratings', () => {
    expect(levelOf(session(1, 0), session(5, 3), session(null, 3), { confidence: [4, null, null], ticked: [3, 3, 3] })).toBe('confident')
    expect(levelOf(session(5, 3), session(null, 3), session(null, 3), session(null, 3))).toBe('building')
  })

  it('looks only at the 3 most recent sessions, so it can go down while Highest reached is kept', () => {
    const record = withSessions([session(5, 3), session(5, 3), session(5, 3), session(5, 3), session(1, 0)])
    const result = readiness(record)
    expect(result.level).toBe('building')
    expect(result.highest).toEqual({ level: 'confident', reachedAt: '2026-10-04T09:00:00.000Z' })
    expect(result.recent).toEqual({ sessions: 3, averageConfidence: 11 / 3, ticked: 18, boxes: 27 })
  })

  it('never counts General English data or runs left before Finish', () => {
    const record = withSessions([
      session(5, 3),
      session(5, 3, { pathway: 'general-english' }),
      session(5, 3, { finished: false }),
    ])
    expect(finishedInterviewSessions(record)).toHaveLength(1)
    expect(readiness(record).level).toBe('gettingStarted')
  })

  it('ignores answers saved before MVP-15, which have no session', () => {
    const record = withSessions([session(5, 3), session(5, 3)])
    const old = { ...record, selfAssessments: record.selfAssessments.map((entry) => ({ ...entry, sessionId: undefined })) }
    expect(readiness(old).recent).toMatchObject({ averageConfidence: null, boxes: 0 })
    expect(levelFor(finishedInterviewSessions(old))).toBe('building')
  })

  it('shows Career speaking practice runs as supporting evidence without changing the level', () => {
    const speaking = (pathway: 'career-readiness' | 'general-english', recordedAt: string) =>
      [0, 1].map((index) => ({
        id: `sp-${recordedAt}-${index}`,
        kind: 'speaking' as const,
        pathway,
        activityId: 'cr-01-a3-speaking',
        itemId: `s${index}`,
        skills: ['speaking' as const],
        selfCheck: [true, true, true],
        recordedAt,
      }))
    const record = withSessions([session(5, 3)])
    const withSpeaking = {
      ...record,
      selfAssessments: [...record.selfAssessments, ...speaking('career-readiness', 't1'), ...speaking('career-readiness', 't2'), ...speaking('general-english', 't3')],
    }
    expect(readiness(withSpeaking)).toMatchObject({ speakingDone: 2, level: 'gettingStarted', sessionsFinished: 1 })
  })
})
