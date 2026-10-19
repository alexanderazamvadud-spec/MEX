import type { LearnerRecord, PracticeSession, SelfAssessment } from './types.ts'

// Self-assessment layer (MVP-12, MVP-13): speaking and interview self-checks the learner
// ticks themselves, with an optional typed answer and confidence. These are
// never called "assessed" or "demonstrated" and never change readiness on their own.

/** Typed interview answers (MVP-13) are kept on this device only, and short so the record stays small. */
export const MAX_ANSWER_LENGTH = 1000

/** Adds one self-assessment. Earlier ones are history and are never changed or removed. */
export function withSelfAssessment(record: LearnerRecord, entry: SelfAssessment): LearnerRecord {
  return { ...record, selfAssessments: [...record.selfAssessments, entry] }
}

function uniqueId(prefix: string, now: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `${prefix}-${now}-${random}`
}

/** A unique id for a new self-assessment. */
export function newSelfAssessmentId(now: string): string {
  return uniqueId('sa', now)
}

/** A unique id for a new interview practice run (MVP-15). */
export function newPracticeSessionId(now: string): string {
  return uniqueId('session', now)
}

/** Records a finished interview practice run (MVP-15); a run with this id is saved only once. */
export function withPracticeSession(record: LearnerRecord, session: PracticeSession): LearnerRecord {
  if (record.practiceSessions.some((entry) => entry.id === session.id)) return record
  return { ...record, practiceSessions: [...record.practiceSessions, session] }
}
