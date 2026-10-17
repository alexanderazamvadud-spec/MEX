import { explanationsDefaultOn } from '../content/index.ts'
import type { ActivityCompletion, LearnerRecord } from './types.ts'

// Lesson viewer rules (MVP-09). Both writes go through LearnerStore.update by the caller.

/**
 * Whether native-language explanations are shown (decision Q3): the learner's own choice
 * when they have made one, otherwise on for Beginner and off for other levels.
 */
export function explanationsOn(record: LearnerRecord): boolean {
  const saved = record.preferences.nativeExplanations
  if (saved !== null) return saved
  return record.profile ? explanationsDefaultOn(record.profile.level) : false
}

export function withNativeExplanations(record: LearnerRecord, on: boolean): LearnerRecord {
  return { ...record, preferences: { ...record.preferences, nativeExplanations: on } }
}

/**
 * Records that an activity was finished (curriculum layer). Finishing it again keeps the
 * first record, so counts never double and the original date is kept.
 */
export function withCompletion(
  record: LearnerRecord,
  completion: Omit<ActivityCompletion, 'completedAt'>,
  now: string,
): LearnerRecord {
  const exists = record.completions.some(
    (item) => item.pathway === completion.pathway && item.activityId === completion.activityId,
  )
  if (exists) return record
  return { ...record, completions: [...record.completions, { ...completion, completedAt: now }] }
}
