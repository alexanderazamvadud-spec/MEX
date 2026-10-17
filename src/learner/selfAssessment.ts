import type { SelfAssessment, LearnerRecord } from './types.ts'

// Self-assessment layer (MVP-12): speaking self-checks the learner ticks themselves. These are
// never called "assessed" or "demonstrated" and never change readiness on their own.

/** Adds one self-assessment. Earlier ones are history and are never changed or removed. */
export function withSelfAssessment(record: LearnerRecord, entry: SelfAssessment): LearnerRecord {
  return { ...record, selfAssessments: [...record.selfAssessments, entry] }
}

/** A unique id for a new self-assessment. */
export function newSelfAssessmentId(now: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `sa-${now}-${random}`
}
