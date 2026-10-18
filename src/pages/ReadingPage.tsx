import QuestionPlayer from '../components/questions/QuestionPlayer.tsx'
import TextCard from '../components/questions/TextCard.tsx'
import type { ReadingItem } from '../content/types.ts'
import { comprehensionItems } from '../learner/exercise.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Reading player (MVP-11, Scope v2 screen S10): the English text stays above every question,
// and the comprehension questions run in the shared question flow.
export default function ReadingPage(props: ActivityPageProps) {
  const readings = props.activity.items.filter((item): item is ReadingItem => item.kind === 'reading')
  return (
    <QuestionPlayer
      {...props}
      items={readings.flatMap(comprehensionItems)}
      intro={readings.map((item) => (
        <TextCard key={item.id} title={item.title} text={item.text} />
      ))}
    />
  )
}
