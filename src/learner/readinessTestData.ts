import type { Confidence, LearnerRecord, SelfAssessment } from './types.ts'
import { createEmptyRecord } from './types.ts'

// Test-only helper (not a test file itself): builds learner records with finished
// interview practice sessions for the readiness tests.

export interface SessionSpec {
  /** One entry per question: the confidence given, or null when not rated. */
  confidence: Array<Confidence | null>
  /** One entry per question: how many of its 3 self-check boxes were ticked. */
  ticked: number[]
  pathway?: 'career-readiness' | 'general-english'
  /** False for a run left before Finish: its answers are saved but no session entry. */
  finished?: boolean
}

const day = (index: number) => `2026-10-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`

export function withSessions(specs: SessionSpec[], record: LearnerRecord = createEmptyRecord()): LearnerRecord {
  let next = record
  specs.forEach((spec, index) => {
    const pathway = spec.pathway ?? 'career-readiness'
    const id = `session-${index}`
    const answers: SelfAssessment[] = spec.ticked.map((ticks, question) => ({
      id: `sa-${index}-${question}`,
      kind: 'interview-question',
      pathway,
      activityId: 'cr-01-a4-interview',
      itemId: `q${question + 1}`,
      skills: ['speaking'],
      selfCheck: [0, 1, 2].map((box) => box < ticks),
      ...(spec.confidence[question] ? { confidence: spec.confidence[question] } : {}),
      sessionId: id,
      recordedAt: day(index),
    }))
    next = {
      ...next,
      selfAssessments: [...next.selfAssessments, ...answers],
      practiceSessions:
        spec.finished === false
          ? next.practiceSessions
          : [...next.practiceSessions, { id, kind: 'interview', pathway, activityId: 'cr-01-a4-interview', finishedAt: day(index) }],
    }
  })
  return next
}

/** A session where every question has the same confidence and number of ticks. */
export function session(confidence: Confidence | null, ticked: number, extra: Partial<SessionSpec> = {}): SessionSpec {
  return { confidence: [confidence, confidence, confidence], ticked: [ticked, ticked, ticked], ...extra }
}
