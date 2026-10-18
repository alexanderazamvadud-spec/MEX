import type { LearnerRecord, PracticeSession, SelfAssessment } from './types.ts'

// Readiness layer (Scope v2 section 3, MVP-15). Career Readiness only and always labelled
// "Self-assessment": the level is the learner's own view, never a test result.
// It is calculated from finished Career Readiness interview practice sessions only
// (owner decision 2026-10-18). General English data and unfinished practice runs are
// never counted. Speaking practice is shown as supporting evidence but never changes
// the level during the pilot.

/**
 * PILOT SETTINGS, approved by the owner on 2026-10-18, to be reviewed after the pilot.
 * Getting started: fewer than `buildingSessions` finished sessions.
 * Building: at least `buildingSessions`.
 * Confident: at least `confidentSessions`, and in the `recentSessions` most recent sessions
 * an average confidence of at least `confidentAverage` and at least `confidentTicked`
 * of the self-check boxes ticked.
 */
export const READINESS_PILOT_SETTINGS = {
  buildingSessions: 2,
  confidentSessions: 4,
  recentSessions: 3,
  confidentAverage: 4,
  confidentTicked: 0.75,
} as const

export type ReadinessLevel = 'gettingStarted' | 'building' | 'confident'

const RANK: Record<ReadinessLevel, number> = { gettingStarted: 0, building: 1, confident: 2 }

export interface SessionEvidence {
  session: PracticeSession
  answers: SelfAssessment[]
}

export interface RecentEvidence {
  /** How many sessions the figures below come from (at most `recentSessions`). */
  sessions: number
  /** Average of the rated questions only; null when none was rated. */
  averageConfidence: number | null
  ticked: number
  boxes: number
}

export interface Readiness {
  level: ReadinessLevel
  sessionsFinished: number
  recent: RecentEvidence
  /** The best level ever reached and when it was first reached (null before any session). */
  highest: { level: ReadinessLevel; reachedAt: string | null }
  /** Finished Career Readiness speaking practice runs: supporting evidence only. */
  speakingDone: number
}

/** Finished Career Readiness interview sessions with their answers, oldest first. */
export function finishedInterviewSessions(record: LearnerRecord): SessionEvidence[] {
  return record.practiceSessions
    .filter((session) => session.kind === 'interview' && session.pathway === 'career-readiness')
    .slice()
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .map((session) => ({
      session,
      answers: record.selfAssessments.filter(
        (entry) => entry.kind === 'interview-question' && entry.pathway === 'career-readiness' && entry.sessionId === session.id,
      ),
    }))
}

export function recentEvidence(sessions: readonly SessionEvidence[]): RecentEvidence {
  const recent = sessions.slice(-READINESS_PILOT_SETTINGS.recentSessions)
  const answers = recent.flatMap((item) => item.answers)
  const ratings = answers.flatMap((answer) => (answer.confidence ? [answer.confidence] : []))
  const boxes = answers.flatMap((answer) => answer.selfCheck)
  return {
    sessions: recent.length,
    averageConfidence: ratings.length > 0 ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null,
    ticked: boxes.filter(Boolean).length,
    boxes: boxes.length,
  }
}

/** The level the given sessions (oldest first) support right now. */
export function levelFor(sessions: readonly SessionEvidence[]): ReadinessLevel {
  const settings = READINESS_PILOT_SETTINGS
  if (sessions.length < settings.buildingSessions) return 'gettingStarted'
  if (sessions.length < settings.confidentSessions) return 'building'
  const recent = recentEvidence(sessions)
  const confident =
    recent.averageConfidence !== null &&
    recent.averageConfidence >= settings.confidentAverage &&
    recent.boxes > 0 &&
    recent.ticked >= recent.boxes * settings.confidentTicked
  return confident ? 'confident' : 'building'
}

/** Distinct finished speaking runs in Career Readiness (one run saves one entry per task). */
function speakingRuns(record: LearnerRecord): number {
  const runs = record.selfAssessments
    .filter((entry) => entry.kind === 'speaking' && entry.pathway === 'career-readiness')
    .map((entry) => `${entry.activityId}|${entry.recordedAt}`)
  return new Set(runs).size
}

export function readiness(record: LearnerRecord): Readiness {
  const sessions = finishedInterviewSessions(record)
  // "Highest reached" replays the sessions in order, so it is never erased by weaker
  // later results and always matches the saved evidence.
  let highest: Readiness['highest'] = { level: 'gettingStarted', reachedAt: null }
  sessions.forEach((item, index) => {
    const level = levelFor(sessions.slice(0, index + 1))
    if (highest.reachedAt === null || RANK[level] > RANK[highest.level]) {
      highest = { level, reachedAt: item.session.finishedAt }
    }
  })
  return {
    level: levelFor(sessions),
    sessionsFinished: sessions.length,
    recent: recentEvidence(sessions),
    highest,
    speakingDone: speakingRuns(record),
  }
}

export function isHigher(a: ReadinessLevel, b: ReadinessLevel): boolean {
  return RANK[a] > RANK[b]
}
