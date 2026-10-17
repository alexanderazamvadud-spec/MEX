import type { Activity, ContentPack, PathwayId, Unit } from '../content/index.ts'

/** What ActivityPage hands to each player once the address is resolved. */
export interface ActivityPageProps {
  pathway: PathwayId
  pack: ContentPack
  unit: Unit
  activity: Activity
}
