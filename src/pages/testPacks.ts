import type { Activity, ContentPack } from '../content/index.ts'

// Every activity in the real packs has a player since MVP-13, so tests of "Opens soon" and of
// activities without a player add this test-only writing activity (its player is a later task)
// to Career Readiness unit 1. The real content is not changed.
export const UNPLAYABLE_ACTIVITY: Activity = {
  id: 'test-writing',
  type: 'writing-checklist',
  title: 'Writing: a short email (test only)',
  instructions: { en: 'Write a short email.' },
  skills: ['writing'],
  estimatedMinutes: 10,
  items: [
    {
      id: 'test-writing-w1',
      kind: 'writing-task',
      skills: ['writing'],
      level: 'elementary',
      content_status: 'placeholder',
      license: 'placeholder',
      task: { en: 'Write a short email to a colleague.' },
      model: 'Hello Aziz, ...',
      checklist: [{ en: 'I greeted the reader.' }],
    },
  ],
} as Activity

export function withUnplayableActivity(pack: ContentPack): ContentPack {
  const [first, ...rest] = pack.units
  return { ...pack, units: [{ ...first, activities: [...first.activities, UNPLAYABLE_ACTIVITY] }, ...rest] }
}
