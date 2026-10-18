import type { LearnerRecord, UsefulnessRating } from './types.ts'

// "Was this useful?" (MVP-14, SH-13): the learner's optional 1-5 rating of an activity, kept
// on this device only. It is feedback about the content, never about the learner, and is
// not used by Today's Mission, progress or readiness.

/**
 * Adds a rating. A rating with the same activity and `ratedAt` (one made on the same summary
 * screen) is changed in place, so changing one's mind does not add another; ratings from
 * earlier visits are history and are kept.
 */
export function withUsefulnessRating(record: LearnerRecord, rating: UsefulnessRating): LearnerRecord {
  const same = (entry: UsefulnessRating) => entry.activityId === rating.activityId && entry.ratedAt === rating.ratedAt
  if (record.usefulnessRatings.some(same)) {
    return { ...record, usefulnessRatings: record.usefulnessRatings.map((entry) => (same(entry) ? rating : entry)) }
  }
  return { ...record, usefulnessRatings: [...record.usefulnessRatings, rating] }
}
