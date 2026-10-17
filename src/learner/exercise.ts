import type { GapFillItem, MatchingItem, MultipleChoiceItem, OrderingItem } from '../content/types.ts'
import type { ExerciseResult, LearnerRecord } from './types.ts'

// Exercise player rules (MVP-10). Answers are checked on the device against the pack;
// the packs hold placeholder items only, so the answer keys are not protected content.

export type ExerciseItem = MultipleChoiceItem | GapFillItem | MatchingItem | OrderingItem

/**
 * The learner's answer to one item, before or after Check.
 * choice: the chosen option (multiple choice, gap-fill), or null.
 * matching: the chosen right-hand text for each pair, in pack order, or null when not chosen.
 * ordering: the segments placed so far, in the order the learner placed them.
 */
export type Answer =
  | { kind: 'choice'; value: string | null }
  | { kind: 'matching'; values: Array<string | null> }
  | { kind: 'ordering'; values: string[] }

export function isExerciseItem(item: { kind: string }): item is ExerciseItem {
  return item.kind === 'multiple-choice' || item.kind === 'gap-fill' || item.kind === 'matching' || item.kind === 'ordering'
}

export function emptyAnswer(item: ExerciseItem): Answer {
  if (item.kind === 'matching') return { kind: 'matching', values: item.pairs.map(() => null) }
  if (item.kind === 'ordering') return { kind: 'ordering', values: [] }
  return { kind: 'choice', value: null }
}

/** Whether the answer is complete enough to check: one option, every pair, every segment. */
export function isComplete(item: ExerciseItem, answer: Answer): boolean {
  if (item.kind === 'matching') return answer.kind === 'matching' && answer.values.every((value) => value !== null)
  if (item.kind === 'ordering') return answer.kind === 'ordering' && answer.values.length === item.segments.length
  return answer.kind === 'choice' && answer.value !== null
}

/** For matching: whether each pair, in pack order, was matched correctly. */
export function pairResults(item: MatchingItem, answer: Answer): boolean[] {
  const values = answer.kind === 'matching' ? answer.values : []
  return item.pairs.map((pair, index) => values[index] === pair.right)
}

/** The whole item is correct only when every part is: the option, every pair, the full order. */
export function checkAnswer(item: ExerciseItem, answer: Answer): boolean {
  if (!isComplete(item, answer)) return false
  if (item.kind === 'matching') return pairResults(item, answer).every(Boolean)
  if (item.kind === 'ordering') {
    return answer.kind === 'ordering' && answer.values.every((value, index) => value === item.segments[index])
  }
  return answer.kind === 'choice' && answer.value === item.answer
}

// A small seeded generator (mulberry32) so a shuffle is the same on every visit and in tests.
function seededRandom(seed: string): () => number {
  let state = 0
  for (const character of seed) state = (Math.imul(state, 31) + character.charCodeAt(0)) | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The values in a fixed shuffled order for this seed. With two or more values that are not
 * all the same, the result is never in the original order, so an item never starts solved.
 */
export function shuffled<T>(values: readonly T[], seed: string): T[] {
  const result = [...values]
  const random = seededRandom(seed)
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  const unchanged = result.every((value, index) => value === values[index])
  if (unchanged && new Set(values).size > 1) result.push(result.shift() as T)
  return result
}

/**
 * Saves one checked answer (demonstrated-skills layer). Results are history: every check,
 * including replays, is added and nothing earlier is changed or removed.
 */
export function withExerciseResult(record: LearnerRecord, result: ExerciseResult): LearnerRecord {
  return { ...record, exerciseResults: [...record.exerciseResults, result] }
}
