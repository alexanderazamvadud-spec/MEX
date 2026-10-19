import type { Activity, ContentPack, Unit } from '../content/index.ts'
import { planMission, type MissionInput, type MissionItem } from './mission.ts'
import { completedActivityIds, unitCompletion } from './progress.ts'
import type { LearnerRecord } from './types.ts'

// Home dashboard rules (MVP-07). Everything here is a pure function of the content pack
// and the saved completions, so Home shows only the learner's real state and never
// invented figures. The mission rules sit behind RecommendationProvider; since MVP-16
// they are the owner's fixed rules in mission.ts. Phase 1 uses fixed rules only, no AI.

export type HomeInput = MissionInput

export interface MissionPlan {
  /** Up to two activities, each with the rule that chose it. Empty only when nothing fits. */
  mission: MissionItem[]
  /** The next activity after the mission, or null when nothing else remains. */
  nextEvent: Activity | null
}

export type RecommendationProvider = (input: HomeInput) => MissionPlan

export interface UnitProgress {
  unit: Unit
  /** 1-based position of the unit in its pathway, for "Unit n". */
  number: number
  done: number
  total: number
}

/**
 * The current unit is the first unit that still has an activity not completed.
 * When every unit is finished, it is the last unit. Null only for a pack with no units.
 */
export function currentUnit({ pack, completions }: HomeInput): UnitProgress | null {
  if (pack.units.length === 0) return null
  const done = completedActivityIds(pack.pathway, completions)
  const index = pack.units.findIndex((unit) => unit.activities.some((activity) => !done.has(activity.id)))
  const position = index === -1 ? pack.units.length - 1 : index
  const unit = pack.units[position]
  const { done: count, total } = unitCompletion(unit, done)
  return { unit, number: position + 1, done: count, total }
}

/** The owner's fixed mission rules (MVP-16); see mission.ts. */
export const fixedRuleProvider: RecommendationProvider = (input) => {
  const { items, nextEvent } = planMission(input)
  return { mission: items, nextEvent }
}

/** What the mission rules read from the learner's record; Home and the unit screen share it. */
export function homeInput(pack: ContentPack, record: LearnerRecord): HomeInput {
  return {
    pack,
    completions: record.completions,
    exerciseResults: record.exerciseResults,
    practiceSessions: record.practiceSessions,
  }
}
