import { describe, expect, it } from 'vitest'
import type { GapFillItem, MatchingItem, MultipleChoiceItem, OrderingItem } from '../content/types.ts'
import { checkAnswer, emptyAnswer, isComplete, pairResults, shuffled, withExerciseResult } from './exercise.ts'
import { createEmptyRecord, type ExerciseResult } from './types.ts'

const base = { skills: ['grammar' as const], level: 'elementary' as const, content_status: 'placeholder' as const, license: 'placeholder' as const }
const explanation = { en: 'Because.' }

const choice: MultipleChoiceItem = { ...base, id: 'mc', kind: 'multiple-choice', prompt: 'P', options: ['a', 'b', 'c'], answer: 'b', explanation }
const gap: GapFillItem = { ...base, id: 'gf', kind: 'gap-fill', sentence: 'She ___ here.', options: ['am', 'is'], answer: 'is', explanation }
const matching: MatchingItem = {
  ...base,
  id: 'm',
  kind: 'matching',
  prompt: 'P',
  pairs: [
    { left: 'L1', right: 'R1' },
    { left: 'L2', right: 'R2' },
    { left: 'L3', right: 'R3' },
  ],
  explanation,
}
const ordering: OrderingItem = { ...base, id: 'o', kind: 'ordering', prompt: 'P', segments: ['I', 'work', 'as', 'a', 'cook.'], explanation }

describe('checkAnswer', () => {
  it('checks multiple choice and gap-fill against the answer', () => {
    expect(checkAnswer(choice, { kind: 'choice', value: 'b' })).toBe(true)
    expect(checkAnswer(choice, { kind: 'choice', value: 'a' })).toBe(false)
    expect(checkAnswer(gap, { kind: 'choice', value: 'is' })).toBe(true)
    expect(checkAnswer(gap, { kind: 'choice', value: 'am' })).toBe(false)
  })

  it('counts matching as correct only when every pair is right, and marks each pair', () => {
    const allRight = { kind: 'matching' as const, values: ['R1', 'R2', 'R3'] }
    const oneWrong = { kind: 'matching' as const, values: ['R1', 'R3', 'R2'] }
    expect(checkAnswer(matching, allRight)).toBe(true)
    expect(checkAnswer(matching, oneWrong)).toBe(false)
    expect(pairResults(matching, oneWrong)).toEqual([true, false, false])
  })

  it('counts ordering as correct only for the full order', () => {
    expect(checkAnswer(ordering, { kind: 'ordering', values: ['I', 'work', 'as', 'a', 'cook.'] })).toBe(true)
    expect(checkAnswer(ordering, { kind: 'ordering', values: ['I', 'as', 'work', 'a', 'cook.'] })).toBe(false)
  })

  it('treats an incomplete answer as not checkable and not correct', () => {
    expect(isComplete(choice, emptyAnswer(choice))).toBe(false)
    expect(isComplete(matching, { kind: 'matching', values: ['R1', null, 'R3'] })).toBe(false)
    expect(isComplete(ordering, { kind: 'ordering', values: ['I', 'work'] })).toBe(false)
    expect(checkAnswer(ordering, { kind: 'ordering', values: ['I', 'work'] })).toBe(false)
    expect(isComplete(ordering, { kind: 'ordering', values: ['I', 'work', 'as', 'a', 'cook.'] })).toBe(true)
  })
})

describe('shuffled', () => {
  it('is stable for the same seed and keeps every value', () => {
    expect(shuffled(ordering.segments, 'o')).toEqual(shuffled(ordering.segments, 'o'))
    expect([...shuffled(ordering.segments, 'o')].sort()).toEqual([...ordering.segments].sort())
  })

  it('never returns the original order', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      expect(shuffled(['a', 'b'], `s${seed}`)).toEqual(['b', 'a'])
      expect(shuffled(ordering.segments, `s${seed}`)).not.toEqual(ordering.segments)
    }
  })
})

describe('withExerciseResult', () => {
  it('adds every result and never changes earlier ones', () => {
    const first: ExerciseResult = { pathway: 'general-english', activityId: 'a', itemId: 'mc', skills: ['grammar'], correct: false, answeredAt: '2026-10-17T10:00:00.000Z' }
    const again: ExerciseResult = { ...first, correct: true, answeredAt: '2026-10-17T11:00:00.000Z' }
    const record = withExerciseResult(withExerciseResult(createEmptyRecord(), first), again)
    expect(record.exerciseResults).toEqual([first, again])
  })
})
