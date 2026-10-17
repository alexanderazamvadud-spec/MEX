import { useParams } from 'react-router'
import { canOpen, PATHWAY_IDS, type PathwayId } from '../content/index.ts'
import { usePack } from '../content/usePack.ts'
import ExercisePage from './ExercisePage.tsx'
import LessonPage from './LessonPage.tsx'
import ListeningPage from './ListeningPage.tsx'
import NotFoundPage from './NotFoundPage.tsx'
import ReadingPage from './ReadingPage.tsx'

// #/learn/:pathway/:unit/:activity (MVP-10): finds the activity in its pack and shows the
// player for its type: the lesson viewer (S8), the exercise player (S9), or the reading
// (S10) or listening (S11) player. An unknown
// address, or an activity type without a player yet, shows Not found.

function isPathwayId(value: string | undefined): value is PathwayId {
  return PATHWAY_IDS.includes(value as PathwayId)
}

export default function ActivityPage() {
  const { pathway, unit: unitId, activity: activityId } = useParams()
  const valid = isPathwayId(pathway)
  const pack = usePack(valid ? pathway : null)

  if (!valid) return <NotFoundPage />
  const unit = pack?.units.find((item) => item.id === unitId)
  const activity = unit?.activities.find((item) => item.id === activityId)
  if (pack && (!unit || !activity || !canOpen(activity))) return <NotFoundPage />
  if (!pack || !unit || !activity) return <div aria-busy="true" />

  const props = { pathway, pack, unit, activity }
  if (activity.type === 'lesson') return <LessonPage {...props} />
  // The question players are keyed by activity so a new activity always starts at question 1.
  const key = `${pathway}/${activity.id}`
  if (activity.type === 'exercise') return <ExercisePage key={key} {...props} />
  if (activity.type === 'reading') return <ReadingPage key={key} {...props} />
  if (activity.type === 'listening') return <ListeningPage key={key} {...props} />
  return <NotFoundPage />
}
