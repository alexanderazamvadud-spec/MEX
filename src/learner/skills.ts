import type { Skill } from '../content/index.ts'
import type { ExerciseResult } from './types.ts'

// Demonstrated-skills layer (Scope v2 section 3, MVP-15): what the learner got right in
// auto-checked exercises, per skill, across both pathways. Only exercise results count;
// speaking and writing are self-assessed and never appear here. When a question was
// answered more than once, the latest answer counts.

export const DEMONSTRATED_SKILLS = ['vocabulary', 'grammar', 'reading', 'listening'] as const satisfies readonly Skill[]

export type DemonstratedSkill = (typeof DEMONSTRATED_SKILLS)[number]

export interface SkillResult {
  skill: DemonstratedSkill
  right: number
  answered: number
}

export function demonstratedSkills(results: readonly ExerciseResult[]): SkillResult[] {
  const latest = new Map<string, ExerciseResult>()
  for (const result of results) {
    const key = `${result.pathway}|${result.activityId}|${result.itemId}`
    const seen = latest.get(key)
    if (!seen || result.answeredAt >= seen.answeredAt) latest.set(key, result)
  }
  return DEMONSTRATED_SKILLS.map((skill) => {
    const counted = [...latest.values()].filter((result) => result.skills.includes(skill))
    return { skill, right: counted.filter((result) => result.correct).length, answered: counted.length }
  })
}
