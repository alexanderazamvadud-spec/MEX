import type { Answer } from '../../learner/exercise.ts'

/** What every item view receives from the exercise player. */
export interface ItemViewProps<T> {
  item: T
  answer: Answer
  onChange: (answer: Answer) => void
  /** After Check the answer is locked and each part shows whether it was right. */
  checked: boolean
}
