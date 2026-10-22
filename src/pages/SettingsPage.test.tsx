// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PathwayId } from '../content/index.ts'
import i18n from '../i18n/index.ts'
import en from '../i18n/locales/en.json'
import ru from '../i18n/locales/ru.json'
import uz from '../i18n/locales/uz.json'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import { createLocalLearnerStore } from '../learner/localStore.ts'
import { withOnboardingProfile } from '../learner/profile.ts'
import type { LearnerStore } from '../learner/types.ts'
import SettingsPage from './SettingsPage.tsx'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

function storeWith(pathway: PathwayId | null, { persistent = true, level = 'beginner' as const } = {}): LearnerStore {
  const store = createLocalLearnerStore({ storage: persistent ? memoryStorage() : null })
  if (pathway) {
    store.update((current) =>
      withOnboardingProfile(current, { interfaceLanguage: 'en', level, goals: ['work'], pathway }, '2026-10-01T00:00:00.000Z'),
    )
  }
  return store
}

function renderSettings(store: LearnerStore) {
  render(
    <LearnerProvider store={store}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </LearnerProvider>,
  )
  return store
}

function section(name: string) {
  const element = document.querySelector<HTMLElement>(`[data-section="${name}"]`)
  if (!element) throw new Error(`No ${name} section`)
  return within(element)
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('SettingsPage', () => {
  it('shows the parts in the approved order, with no saffron action', () => {
    renderSettings(storeWith('general-english'))
    expect(screen.getByRole('heading', { level: 1, name: en.nav.settings })).toBeTruthy()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual([en.language.label, en.home.pathway.title, en.settings.explanationsTitle, en.settings.deleteData, en.settings.aboutTitle])
    expect(screen.getByText(en.settings.privacyNote)).toBeTruthy()
    expect(document.querySelector('.bg-accent')).toBeNull()
    expect(screen.queryByText(/coming in a later task/)).toBeNull()
  })

  it('changes the interface language at once without changing the saved profile', async () => {
    const store = renderSettings(storeWith('general-english'))
    fireEvent.click(section('language').getByRole('button', { name: 'Русский' }))
    expect(await screen.findByRole('heading', { level: 1, name: ru.nav.settings })).toBeTruthy()
    expect(store.read().profile?.interfaceLanguage).toBe('en')
  })

  it('switches the pathway after the in-card confirmation and keeps progress', async () => {
    const store = renderSettings(storeWith('general-english'))
    const career = en.landing.pathways.careerReadiness.name
    fireEvent.click(section('pathway').getByRole('button', { name: en.settings.pathwaySwitchTo.replace('{{pathway}}', career) }))
    expect(section('pathway').getByText(en.home.pathway.confirm.replace('{{pathway}}', career))).toBeTruthy()
    expect(store.read().profile?.pathway).toBe('general-english')
    fireEvent.click(section('pathway').getByRole('button', { name: en.home.pathway.confirmYes }))
    expect(store.read().profile?.pathway).toBe('career-readiness')
    expect(section('pathway').getByText(career)).toBeTruthy()
    // Focus returns to the switch button, which now offers the other pathway.
    expect(document.activeElement?.textContent).toBe(en.settings.pathwaySwitchTo.replace('{{pathway}}', en.landing.pathways.generalEnglish.name))
  })

  it('cancels a pathway switch without saving anything', () => {
    const store = renderSettings(storeWith('career-readiness'))
    const before = store.read()
    fireEvent.click(section('pathway').getAllByRole('button')[0])
    fireEvent.click(section('pathway').getByRole('button', { name: en.home.pathway.cancel }))
    expect(store.read()).toBe(before)
  })

  it('hides the explanation switch in an English interface and explains why', () => {
    renderSettings(storeWith('general-english'))
    expect(section('explanations').queryByRole('switch')).toBeNull()
    const note = section('explanations').getByText(/Explanations are available/)
    expect(note.textContent).toBe('Explanations are available when the interface is in Oʻzbekcha or Русский.')
    expect(note.querySelector('[lang="uz"]')?.textContent).toBe('Oʻzbekcha')
    expect(note.querySelector('[lang="ru"]')?.textContent).toBe('Русский')
  })

  it('saves the explanation choice used by lessons and exercises', async () => {
    await act(() => i18n.changeLanguage('uz'))
    const store = renderSettings(storeWith('general-english'))
    const toggle = section('explanations').getByRole('switch', { name: uz.lesson.toggle.replace('{{language}}', 'Oʻzbekcha') })
    // Beginner: on by default (decision Q3).
    expect((toggle as HTMLInputElement).checked).toBe(true)
    expect(store.read().preferences.nativeExplanations).toBeNull()
    fireEvent.click(toggle)
    expect(store.read().preferences.nativeExplanations).toBe(false)
    expect((toggle as HTMLInputElement).checked).toBe(false)
  })

  it('shows the version from the build', () => {
    renderSettings(storeWith('general-english'))
    const version = document.querySelector('[data-version]')?.textContent ?? ''
    expect(version).toMatch(/^Version 0\.1\.0 \(build [0-9a-z]+, \d{1,2} [A-Z][a-z]+ \d{4}\)$/)
    expect(section('about').getByText(en.settings.aboutBody)).toBeTruthy()
    expect(section('about').getByRole('link', { name: en.legal.link }).getAttribute('href')).toBe('/terms')
  })

  it('shows the storage notice only when the device cannot save', () => {
    renderSettings(storeWith('general-english'))
    expect(document.querySelector('[data-storage-notice]')).toBeNull()
    cleanup()
    renderSettings(storeWith('general-english', { persistent: false }))
    expect(document.querySelector('[data-storage-notice]')?.textContent).toBe(en.onboarding.storageNotice)
  })

  it('works without a profile: the pathway part is hidden', () => {
    renderSettings(storeWith(null))
    expect(document.querySelector('[data-section="pathway"]')).toBeNull()
    expect(screen.getByRole('button', { name: en.settings.deleteData })).toBeTruthy()
  })
})
