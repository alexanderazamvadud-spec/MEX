import { describe, expect, it } from 'vitest'
import { LANGUAGE_STORAGE_KEY } from '../i18n/storageKey.ts'
import { LEARNER_STORAGE_KEY, createLocalLearnerStore, migrateRecord } from './localStore.ts'
import { LEARNER_SCHEMA_VERSION, createEmptyRecord } from './types.ts'

// Minimal in-memory Storage for tests.
function memoryStorage(initial: Record<string, string> = {}, options: { failWrites?: boolean } = {}): Storage {
  const map = new Map(Object.entries(initial))
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
      if (options.failWrites && !key.startsWith('__')) throw new Error('quota exceeded')
      map.set(key, value)
    },
  }
}

const fixedNow = () => '2026-10-09T10:00:00.000Z'

describe('createLocalLearnerStore', () => {
  it('starts with an empty record when nothing is stored', () => {
    const store = createLocalLearnerStore({ storage: memoryStorage(), now: fixedNow })
    expect(store.read()).toEqual(createEmptyRecord())
    expect(store.persistent).toBe(true)
  })

  it('persists updates, stamps updatedAt and notifies subscribers', () => {
    const storage = memoryStorage()
    const store = createLocalLearnerStore({ storage, now: fixedNow })
    let notified = 0
    store.subscribe(() => notified++)

    const next = store.update((record) => ({
      ...record,
      completions: [{ pathway: 'general-english', unitId: 'u1', activityId: 'a1', completedAt: fixedNow() }],
    }))

    expect(next.updatedAt).toBe(fixedNow())
    expect(next.schemaVersion).toBe(LEARNER_SCHEMA_VERSION)
    expect(notified).toBe(1)
    const reloaded = createLocalLearnerStore({ storage, now: fixedNow })
    expect(reloaded.read().completions).toHaveLength(1)
    expect(reloaded.read().completions[0].activityId).toBe('a1')
  })

  it('returns the same record object until the next update', () => {
    const store = createLocalLearnerStore({ storage: memoryStorage(), now: fixedNow })
    const first = store.read()
    expect(store.read()).toBe(first)
    store.update((record) => ({ ...record, preferences: { nativeExplanations: true } }))
    expect(store.read()).not.toBe(first)
  })

  it('reset removes the learner record and the language choice', () => {
    const storage = memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'uz' })
    const store = createLocalLearnerStore({ storage, now: fixedNow })
    store.update((record) => ({ ...record, preferences: { nativeExplanations: false } }))
    expect(storage.getItem(LEARNER_STORAGE_KEY)).not.toBeNull()

    store.reset()

    expect(store.read()).toEqual(createEmptyRecord())
    expect(storage.getItem(LEARNER_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull()
  })

  it('falls back to an empty record when the stored data is corrupt', () => {
    const storage = memoryStorage({ [LEARNER_STORAGE_KEY]: '{not json' })
    const store = createLocalLearnerStore({ storage, now: fixedNow })
    expect(store.read()).toEqual(createEmptyRecord())
  })

  it('works in memory when storage is unavailable', () => {
    const store = createLocalLearnerStore({ storage: null, now: fixedNow })
    expect(store.persistent).toBe(false)
    const next = store.update((record) => ({ ...record, preferences: { nativeExplanations: true } }))
    expect(next.preferences.nativeExplanations).toBe(true)
    expect(store.read().preferences.nativeExplanations).toBe(true)
    expect(() => store.reset()).not.toThrow()
  })

  it('keeps working when a write fails and reports that data is no longer persistent', () => {
    const store = createLocalLearnerStore({ storage: memoryStorage({}, { failWrites: true }), now: fixedNow })
    expect(store.persistent).toBe(true)
    const next = store.update((record) => ({ ...record, preferences: { nativeExplanations: true } }))
    expect(next.preferences.nativeExplanations).toBe(true)
    expect(store.read().preferences.nativeExplanations).toBe(true)
    expect(store.persistent).toBe(false)
  })

  it('re-reads the record when another tab changes or deletes it', () => {
    const storage = memoryStorage()
    const events = new EventTarget()
    const store = createLocalLearnerStore({ storage, now: fixedNow, changeEvents: events })
    store.update((record) => ({ ...record, preferences: { nativeExplanations: true } }))
    let notified = 0
    store.subscribe(() => notified++)

    // Another tab deleted everything.
    storage.removeItem(LEARNER_STORAGE_KEY)
    events.dispatchEvent(Object.assign(new Event('storage'), { key: LEARNER_STORAGE_KEY, newValue: null }))
    expect(store.read()).toEqual(createEmptyRecord())
    expect(notified).toBe(1)

    // Another tab wrote a new record.
    storage.setItem(LEARNER_STORAGE_KEY, JSON.stringify({ ...createEmptyRecord(), preferences: { nativeExplanations: false } }))
    events.dispatchEvent(Object.assign(new Event('storage'), { key: LEARNER_STORAGE_KEY }))
    expect(store.read().preferences.nativeExplanations).toBe(false)

    // Unrelated keys are ignored.
    events.dispatchEvent(Object.assign(new Event('storage'), { key: 'other' }))
    expect(notified).toBe(2)
  })

  it('stops notifying after unsubscribe', () => {
    const store = createLocalLearnerStore({ storage: memoryStorage(), now: fixedNow })
    let notified = 0
    const unsubscribe = store.subscribe(() => notified++)
    store.update((record) => ({ ...record }))
    unsubscribe()
    store.update((record) => ({ ...record }))
    expect(notified).toBe(1)
  })
})

describe('migrateRecord', () => {
  it('fills missing fields with defaults', () => {
    const migrated = migrateRecord({ schemaVersion: 1, completions: [{ pathway: 'general-english', unitId: 'u', activityId: 'a', completedAt: 'x' }] })
    expect(migrated.completions).toHaveLength(1)
    expect(migrated.exerciseResults).toEqual([])
    expect(migrated.preferences).toEqual({ nativeExplanations: null })
    expect(migrated.profile).toBeNull()
  })

  it('treats records from a newer schema as empty', () => {
    expect(migrateRecord({ schemaVersion: LEARNER_SCHEMA_VERSION + 1, completions: [{}] })).toEqual(createEmptyRecord())
  })

  it('treats non-objects as empty', () => {
    expect(migrateRecord('text')).toEqual(createEmptyRecord())
    expect(migrateRecord(null)).toEqual(createEmptyRecord())
    expect(migrateRecord([1, 2])).toEqual({ ...createEmptyRecord() })
  })
})
