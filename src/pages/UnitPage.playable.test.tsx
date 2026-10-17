// @vitest-environment jsdom
import { act, cleanup, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPack } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import { renderAt, storeWith } from './learnTestUtils.tsx'

// Simulates a later task adding the lesson player: lessons become openable, so their
// "Opens soon" label disappears and the row links to the activity, with no other change.
vi.mock('../content/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../content/index.ts')>()
  return { ...actual, canOpen: (activity: { type: string }) => activity.type === 'lesson' }
})

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(cleanup)

describe('Unit overview once a player exists', () => {
  it('drops "Opens soon" and links the activity for playable types only', async () => {
    const pack = await loadPack('general-english')
    const unit = pack.units[0]
    renderAt(`/learn/general-english/${unit.id}`, storeWith('general-english'))
    await screen.findByText(en.learn.activities)
    for (const activity of unit.activities) {
      const row = within(document.querySelector<HTMLElement>(`[data-activity="${activity.id}"]`)!)
      if (activity.type === 'lesson') {
        expect(row.queryByText(en.learn.opensSoon)).toBeNull()
        expect(row.getByRole('link').getAttribute('href')).toBe(`/learn/general-english/${unit.id}/${activity.id}`)
      } else {
        expect(row.getByText(en.learn.opensSoon)).toBeTruthy()
        expect(row.queryByRole('link')).toBeNull()
      }
    }
  })
})
