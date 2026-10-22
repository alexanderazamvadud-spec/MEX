// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { isPlaceholder, loadPack, PATHWAY_IDS } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import uz from '../i18n/locales/uz.json'
import { renderAt, storeWith } from './learnTestUtils.tsx'

// Pre-release check (MVP-18): while a pack is placeholder content, every screen that shows it
// carries the "Sample content" label, in every interface language: Home, the pathway overview,
// each unit overview and each activity.

const LOCALES = { en, uz, ru } as const

afterEach(cleanup)

async function expectLabel(path: string, pathway: (typeof PATHWAY_IDS)[number], label: string) {
  renderAt(path, storeWith(pathway))
  await screen.findByRole('heading', { level: 1 })
  const found = await screen.findAllByText(label, { exact: true }).catch(() => [])
  expect(found.length, `"${label}" on ${path}`).toBeGreaterThan(0)
  cleanup()
}

describe('Sample content labels', () => {
  for (const [language, locale] of Object.entries(LOCALES)) {
    for (const pathway of PATHWAY_IDS) {
      it(`are shown on every ${pathway} screen in ${language}`, async () => {
        await act(() => i18n.changeLanguage(language))
        const pack = await loadPack(pathway)
        expect(isPlaceholder(pack.content_status)).toBe(true)
        const label = locale.home.sampleContent
        await expectLabel('/home', pathway, label)
        await expectLabel(`/learn/${pathway}`, pathway, label)
        for (const unit of pack.units) {
          await expectLabel(`/learn/${pathway}/${unit.id}`, pathway, label)
          for (const activity of unit.activities) {
            await expectLabel(`/learn/${pathway}/${unit.id}/${activity.id}`, pathway, label)
          }
        }
      }, 60000)
    }
  }
})
