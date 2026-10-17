import type { Activity, ContentPack, PathwayId, Unit } from '../content/index.ts'
import type { ActivityCompletion } from './types.ts'

// Home dashboard rules (MVP-07). Everything here is a pure function of the content pack
// and the saved completions, so Home shows only the learner's real state and never
// invented figures. The mission rule sits behind RecommendationProvider so MVP-16 can
// replace it without changing the screen; Phase 1 uses fixed rules only, no AI.

const MISSION_SIZE = 2

export interface HomeInput {
  pack: ContentPack
  completions: readonly ActivityCompletion[]
}

export interface MissionPlan {
  /** Up to two activities, in content order. Empty when every activity is completed. */
  mission: Activity[]
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

function completedIds(pathway: PathwayId, completions: readonly ActivityCompletion[]): Set<string> {
  return new Set(completions.filter((item) => item.pathway === pathway).map((item) => item.activityId))
}

/**
 * The current unit is the first unit that still has an activity not completed.
 * When every unit is finished, it is the last unit. Null only for a pack with no units.
 */
export function currentUnit({ pack, completions }: HomeInput): UnitProgress | null {
  if (pack.units.length === 0) return null
  const done = completedIds(pack.pathway, completions)
  const index = pack.units.findIndex((unit) => unit.activities.some((activity) => !done.has(activity.id)))
  const position = index === -1 ? pack.units.length - 1 : index
  const unit = pack.units[position]
  return {
    unit,
    number: position + 1,
    done: unit.activities.filter((activity) => done.has(activity.id)).length,
    total: unit.activities.length,
  }
}

/**
 * Fixed rule (approved for MVP-07): the mission is the next two activities not yet
 * completed in the current unit; the next event is the next activity not yet completed
 * after them, in this unit or, if none is left here, in a later unit.
 */
export const fixedRuleProvider: RecommendationProvider = ({ pack, completions }) => {
  const done = completedIds(pack.pathway, completions)
  const progress = currentUnit({ pack, completions })
  if (!progress) return { mission: [], nextEvent: null }

  const remainingHere = progress.unit.activities.filter((activity) => !done.has(activity.id))
  const mission = remainingHere.slice(0, MISSION_SIZE)
  const later = pack.units
    .slice(progress.number)
    .flatMap((unit) => unit.activities)
    .filter((activity) => !done.has(activity.id))
  const nextEvent = remainingHere[MISSION_SIZE] ?? later[0] ?? null
  return { mission, nextEvent }
}
