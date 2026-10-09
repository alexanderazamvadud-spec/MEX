import type { Level, PathwayId, Skill } from '../content/types.ts'
import type { SupportedLanguage } from '../i18n/index.ts'

// Learner data kept only on the learner's device (owner decision Q1, Phase 1).
// MEX collects no identifying fields (no name, email, phone or device identifier).
// Typed practice answers are free text and may contain whatever the learner writes;
// they stay on the device and are removed by "Delete my data". Everything is keyed
// by content ids so progress survives content edits. The record carries a schema
// version so its shape can evolve, and all access goes through LearnerStore so
// an account-backed store can be added later without changing screens.

export const LEARNER_SCHEMA_VERSION = 1 as const

export type Goal = 'everyday' | 'study' | 'work'

export type Confidence = 1 | 2 | 3 | 4 | 5

export interface LearnerProfile {
  interfaceLanguage: SupportedLanguage
  /** Self-reported, never a tested level. */
  level: Level
  goals: Goal[]
  pathway: PathwayId
  createdAt: string
  updatedAt: string
}

/** Curriculum completion layer: what the learner has finished. */
export interface ActivityCompletion {
  pathway: PathwayId
  unitId: string
  activityId: string
  completedAt: string
}

/** Demonstrated-skills layer: auto-checked exercise results. */
export interface ExerciseResult {
  pathway: PathwayId
  activityId: string
  itemId: string
  skills: Skill[]
  correct: boolean
  answeredAt: string
}

/** Self-assessment layer: speaking, interview and writing practice, never called "assessed". */
export interface SelfAssessment {
  id: string
  kind: 'speaking' | 'interview-question' | 'writing-task'
  pathway: PathwayId
  activityId: string
  itemId: string
  skills: Skill[]
  /** The learner's typed answer, kept so it could later be sent for feedback (Scope v2, 5.4). */
  answerText?: string
  selfCheck: boolean[]
  confidence?: Confidence
  recordedAt: string
}

export interface UsefulnessRating {
  activityId: string
  rating: Confidence
  ratedAt: string
}

export interface LearnerPreferences {
  /** null means "use the default for the learner's level" (decision Q3). */
  nativeExplanations: boolean | null
}

export interface LearnerRecord {
  schemaVersion: typeof LEARNER_SCHEMA_VERSION
  profile: LearnerProfile | null
  preferences: LearnerPreferences
  completions: ActivityCompletion[]
  exerciseResults: ExerciseResult[]
  selfAssessments: SelfAssessment[]
  usefulnessRatings: UsefulnessRating[]
  updatedAt: string | null
}

export function createEmptyRecord(): LearnerRecord {
  return {
    schemaVersion: LEARNER_SCHEMA_VERSION,
    profile: null,
    preferences: { nativeExplanations: null },
    completions: [],
    exerciseResults: [],
    selfAssessments: [],
    usefulnessRatings: [],
    updatedAt: null,
  }
}

/** The interface every screen uses. Phase 1 has one implementation (browser storage). */
export interface LearnerStore {
  /** Current record; the same object is returned until the next update. */
  read(): LearnerRecord
  /** Applies a change and persists the result. The mutator must return a new record. */
  update(mutate: (record: LearnerRecord) => LearnerRecord): LearnerRecord
  /** Deletes everything this store owns on the device. */
  reset(): void
  subscribe(listener: () => void): () => void
  /** False when browser storage is unavailable and data lives only in memory for this session. */
  readonly persistent: boolean
}
