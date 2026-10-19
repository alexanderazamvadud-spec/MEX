import { describe, expect, it } from 'vitest'
import { demonstratedSkills } from './skills.ts'
import type { ExerciseResult } from './types.ts'

const result = (itemId: string, skills: ExerciseResult['skills'], correct: boolean, answeredAt: string, pathway: ExerciseResult['pathway'] = 'general-english'): ExerciseResult => ({
  pathway,
  activityId: 'a',
  itemId,
  skills,
  correct,
  answeredAt,
})

describe('demonstratedSkills', () => {
  it('shows the four checked skills, with nothing practised yet', () => {
    expect(demonstratedSkills([])).toEqual([
      { skill: 'vocabulary', right: 0, answered: 0 },
      { skill: 'grammar', right: 0, answered: 0 },
      { skill: 'reading', right: 0, answered: 0 },
      { skill: 'listening', right: 0, answered: 0 },
    ])
  })

  it('counts the latest answer per question, under each of its skills, across both pathways', () => {
    const skills = demonstratedSkills([
      result('q1', ['grammar', 'vocabulary'], false, 't1'),
      result('q1', ['grammar', 'vocabulary'], true, 't2'),
      result('q2', ['grammar'], false, 't1', 'career-readiness'),
      result('q3', ['reading', 'interaction'], true, 't1'),
    ])
    expect(skills).toEqual([
      { skill: 'vocabulary', right: 1, answered: 1 },
      { skill: 'grammar', right: 1, answered: 2 },
      { skill: 'reading', right: 1, answered: 1 },
      { skill: 'listening', right: 0, answered: 0 },
    ])
  })
})
