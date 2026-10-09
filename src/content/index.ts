import type { ContentItem, ContentPack, ContentStatus, Level, PathwayId } from './types.ts'

export type { Activity, ContentItem, ContentPack, ContentStatus, Level, LocalizedText, PathwayId, Skill, Unit } from './types.ts'
export { ITEM_KINDS_BY_ACTIVITY } from './types.ts'

export const PATHWAY_IDS: readonly PathwayId[] = ['general-english', 'career-readiness']

// Plain-word levels in display order (decision Q9: no CEFR codes).
export const LEVELS: readonly Level[] = ['beginner', 'elementary', 'intermediate']

// Packs are loaded on demand so the shell bundle does not carry the content.
// The JSON files are validated against src/content/schema/content-pack.schema.json
// by `npm run check:content`, which also runs before every deployment, so the
// cast below is backed by that check rather than by TypeScript alone.
const loaders: Record<PathwayId, () => Promise<{ default: unknown }>> = {
  'general-english': () => import('./packs/general-english.json'),
  'career-readiness': () => import('./packs/career-readiness.json'),
}

export async function loadPack(pathway: PathwayId): Promise<ContentPack> {
  const loader = loaders[pathway]
  if (!loader) {
    throw new Error(`MEX has no content pack for pathway "${pathway}".`)
  }
  const module = await loader()
  return module.default as ContentPack
}

/** Placeholder content must always be shown with a "Sample content" label. */
export function isPlaceholder(status: ContentStatus): boolean {
  return status === 'placeholder'
}

/** Native-language explanations default on for Beginner and off otherwise (decision Q3). */
export function explanationsDefaultOn(level: Level): boolean {
  return level === 'beginner'
}

export function findUnit(pack: ContentPack, unitId: string) {
  return pack.units.find((unit) => unit.id === unitId)
}

export function findActivity(pack: ContentPack, unitId: string, activityId: string) {
  return findUnit(pack, unitId)?.activities.find((activity) => activity.id === activityId)
}

export function countItems(pack: ContentPack): number {
  return pack.units.reduce(
    (total, unit) => total + unit.activities.reduce((sum, activity) => sum + activity.items.length, 0),
    0,
  )
}

export function itemsOfKind<K extends ContentItem['kind']>(pack: ContentPack, kind: K): Array<Extract<ContentItem, { kind: K }>> {
  const found: Array<Extract<ContentItem, { kind: K }>> = []
  for (const unit of pack.units) {
    for (const activity of unit.activities) {
      for (const item of activity.items) {
        if (item.kind === kind) found.push(item as Extract<ContentItem, { kind: K }>)
      }
    }
  }
  return found
}
