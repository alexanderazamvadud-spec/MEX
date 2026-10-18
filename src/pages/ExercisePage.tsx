import QuestionPlayer from '../components/questions/QuestionPlayer.tsx'
import { isExerciseItem } from '../learner/exercise.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Exercise player (MVP-10, Scope v2 screen S9), shown by ActivityPage for exercise
// activities: multiple choice, gap-fill, matching and ordering in the shared question flow.
export default function ExercisePage(props: ActivityPageProps) {
  return <QuestionPlayer {...props} items={props.activity.items.filter(isExerciseItem)} />
}
