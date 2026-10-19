import type { Activity, ActivityType, ContentPack, Unit } from '../content/index.ts'
import { completedActivityIds } from './progress.ts'
import type { ActivityCompletion, ExerciseResult, PracticeSession } from './types.ts'

// Today's Mission rules (MVP-16, owner decision 2026-10-19). Fixed rules anyone can
// read: no AI, no hidden scoring, nothing learned from other learners. Each item carries
// the rule that chose it, so "Why this mission?" can say so in one honest sentence.

/** PILOT SETTINGS, approved by the owner on 2026-10-19, to be reviewed after the pilot. */
export const MISSION_PILOT_SETTINGS = {
  /** At most this many items from the curriculum rules. */
  maxItems: 2,
  /** The second item joins only if the total stays at or below this ("about 15 minutes"). */
  maxMinutes: 20,
  /** Career Readiness: interview practice joins when none was finished in this many days. */
  interviewGapDays: 7,
} as const

const DAY_MS = 24 * 60 * 60 * 1000

/** Activities with auto-checked questions; only these have a score for the repeat rule. */
const SCORED_TYPES: ReadonlySet<ActivityType> = new Set<ActivityType>(['exercise', 'reading', 'listening'])

export type MissionReason =
  | { rule: 'next'; unit: number }
  | { rule: 'nextUnit'; finished: number; unit: number }
  | { rule: 'interview' }
  | { rule: 'repeat'; right: number; total: number }

export interface MissionItem {
  activity: Activity
  /** The unit the activity belongs to, for its link. */
  unitId: string
  reason: MissionReason
}

export interface MissionInput {
  pack: ContentPack
  completions: readonly ActivityCompletion[]
  exerciseResults?: readonly ExerciseResult[]
  practiceSessions?: readonly PracticeSession[]
  /** The current time (ISO); defaults to now. */
  now?: string
}

export interface ActivityScore {
  activity: Activity
  unitId: string
  right: number
  total: number
}

/** Score per scored activity, from the latest answer to each question, in pathway order. */
export function activityScores(pack: ContentPack, results: readonly ExerciseResult[]): ActivityScore[] {
  const latest = new Map<string, ExerciseResult>()
  for (const result of results) {
    if (result.pathway !== pack.pathway) continue
    const key = `${result.activityId}|${result.itemId}`
    const seen = latest.get(key)
    if (!seen || result.answeredAt >= seen.answeredAt) latest.set(key, result)
  }
  return pack.units.flatMap((unit) =>
    unit.activities
      .filter((activity) => SCORED_TYPES.has(activity.type))
      .flatMap((activity) => {
        const answers = [...latest.values()].filter((result) => result.activityId === activity.id)
        if (answers.length === 0) return []
        return [{ activity, unitId: unit.id, right: answers.filter((result) => result.correct).length, total: answers.length }]
      }),
  )
}

/** The lowest score; on a tie, the activity that comes first in the pathway. */
export function lowestScore(scores: readonly ActivityScore[]): ActivityScore | null {
  let lowest: ActivityScore | null = null
  for (const score of scores) {
    if (!lowest || score.right * lowest.total < lowest.right * score.total) lowest = score
  }
  return lowest
}

/**
 * True when the learner has finished at least one Career Readiness interview session
 * and none in the last `interviewGapDays` days (owner decision, item 2).
 */
export function interviewDue(sessions: readonly PracticeSession[], now: string): boolean {
  const finished = sessions.filter((session) => session.kind === 'interview' && session.pathway === 'career-readiness')
  if (finished.length === 0) return false
  const last = Math.max(...finished.map((session) => Date.parse(session.finishedAt)))
  return Date.parse(now) - last >= MISSION_PILOT_SETTINGS.interviewGapDays * DAY_MS
}

/** The interview practice activity of the given unit, or of the nearest earlier unit. */
function interviewActivity(units: readonly Unit[], position: number): { activity: Activity; unitId: string } | null {
  for (let index = position; index >= 0; index--) {
    const activity = units[index].activities.find((item) => item.type === 'interview-practice')
    if (activity) return { activity, unitId: units[index].id }
  }
  return null
}

export function totalMinutes(items: readonly MissionItem[]): number {
  return items.reduce((sum, item) => sum + item.activity.estimatedMinutes, 0)
}

export interface Mission {
  items: MissionItem[]
  /** The next activity not completed and not in the mission, or null. */
  nextEvent: Activity | null
}

export function planMission({ pack, completions, exerciseResults = [], practiceSessions = [], now = new Date().toISOString() }: MissionInput): Mission {
  const units = pack.units
  if (units.length === 0) return { items: [], nextEvent: null }
  const done = completedActivityIds(pack.pathway, completions)
  const firstOpen = units.findIndex((unit) => unit.activities.some((activity) => !done.has(activity.id)))
  const position = firstOpen === -1 ? units.length - 1 : firstOpen
  const unit = units[position]

  let items: MissionItem[] = []
  if (firstOpen === -1) {
    // Everything finished: repeat the activity with the lowest exercise score.
    const lowest = lowestScore(activityScores(pack, exerciseResults))
    if (lowest) items = [{ activity: lowest.activity, unitId: lowest.unitId, reason: { rule: 'repeat', right: lowest.right, total: lowest.total } }]
  } else {
    const remaining = unit.activities.filter((activity) => !done.has(activity.id))
    const started = remaining.length < unit.activities.length
    if (position > 0 && !started) {
      // The previous unit is finished and this one is untouched: start it with its first activity.
      items = [{ activity: unit.activities[0], unitId: unit.id, reason: { rule: 'nextUnit', finished: position, unit: position + 1 } }]
    } else {
      // Default: the next unfinished activities here, the second only within the time limit.
      for (const activity of remaining.slice(0, MISSION_PILOT_SETTINGS.maxItems)) {
        const minutes = totalMinutes(items) + activity.estimatedMinutes
        if (items.length > 0 && minutes > MISSION_PILOT_SETTINGS.maxMinutes) break
        items.push({ activity, unitId: unit.id, reason: { rule: 'next', unit: position + 1 } })
      }
    }
  }

  // Career Readiness: interview practice takes the second slot when it is due.
  if (pack.pathway === 'career-readiness' && interviewDue(practiceSessions, now)) {
    const interview = interviewActivity(units, position)
    if (interview && !items.some((item) => item.activity.id === interview.activity.id)) {
      items = [...items.slice(0, MISSION_PILOT_SETTINGS.maxItems - 1), { ...interview, reason: { rule: 'interview' } }]
    }
  }

  const inMission = new Set(items.map((item) => item.activity.id))
  const nextEvent =
    units
      .slice(position)
      .flatMap((item) => item.activities)
      .find((activity) => !done.has(activity.id) && !inMission.has(activity.id)) ?? null
  return { items, nextEvent }
}
