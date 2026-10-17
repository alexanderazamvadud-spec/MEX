import type { PathwayId, Unit } from '../content/index.ts'
import type { ActivityCompletion } from './types.ts'

// Curriculum-completion layer (Scope v2, section 3): what the learner has finished,
// counted from saved completions of one pathway. Never mixed with skills or readiness.

export type UnitStatus = 'notStarted' | 'inProgress' | 'completed'

export interface UnitCompletion {
  done: number
  total: number
  status: UnitStatus
}

export function completedActivityIds(pathway: PathwayId, completions: readonly ActivityCompletion[]): Set<string> {
  return new Set(completions.filter((item) => item.pathway === pathway).map((item) => item.activityId))
}

export function unitCompletion(unit: Unit, done: ReadonlySet<string>): UnitCompletion {
  const count = unit.activities.filter((activity) => done.has(activity.id)).length
  const total = unit.activities.length
  const status: UnitStatus = count === 0 ? 'notStarted' : count === total ? 'completed' : 'inProgress'
  return { done: count, total, status }
}
