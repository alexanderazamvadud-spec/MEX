import { LANGUAGE_STORAGE_KEY } from '../i18n/storageKey.ts'
import { LEARNER_SCHEMA_VERSION, createEmptyRecord, type LearnerRecord, type LearnerStore } from './types.ts'

export const LEARNER_STORAGE_KEY = 'mex.learner'

export interface LocalStoreOptions {
  /** Storage to use; defaults to the browser's localStorage. Pass null to force in-memory mode. */
  storage?: Storage | null
  key?: string
  /** Other keys this app owns on the device; removed on reset. */
  relatedKeys?: string[]
  now?: () => string
  /** Where "storage" events from other tabs arrive; defaults to window when available. */
  changeEvents?: EventTarget | null
}

function resolveStorage(explicit: Storage | null | undefined): Storage | null {
  if (explicit === null) return null
  const candidate = explicit ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!candidate) return null
  // Private windows and blocked storage can throw on first use; probe once.
  try {
    const probe = '__mex_probe__'
    candidate.setItem(probe, '1')
    candidate.removeItem(probe)
    return candidate
  } catch {
    return null
  }
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Turns whatever is on disk into a valid record. Unknown or newer versions and
 * corrupt data fall back to an empty record rather than breaking the app.
 */
export function migrateRecord(raw: unknown): LearnerRecord {
  const empty = createEmptyRecord()
  if (!raw || typeof raw !== 'object') return empty
  const data = raw as Record<string, unknown>
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0
  if (version > LEARNER_SCHEMA_VERSION) return empty
  // Version 0 (no version) and version 1 share the same shape; missing fields take defaults.
  const preferences = (data.preferences && typeof data.preferences === 'object' ? data.preferences : {}) as Record<string, unknown>
  return {
    schemaVersion: LEARNER_SCHEMA_VERSION,
    profile: data.profile && typeof data.profile === 'object' ? (data.profile as LearnerRecord['profile']) : null,
    preferences: {
      nativeExplanations: typeof preferences.nativeExplanations === 'boolean' ? preferences.nativeExplanations : null,
    },
    completions: isArray(data.completions) ? (data.completions as LearnerRecord['completions']) : [],
    exerciseResults: isArray(data.exerciseResults) ? (data.exerciseResults as LearnerRecord['exerciseResults']) : [],
    selfAssessments: isArray(data.selfAssessments) ? (data.selfAssessments as LearnerRecord['selfAssessments']) : [],
    usefulnessRatings: isArray(data.usefulnessRatings) ? (data.usefulnessRatings as LearnerRecord['usefulnessRatings']) : [],
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
  }
}

export function createLocalLearnerStore(options: LocalStoreOptions = {}): LearnerStore {
  const storage = resolveStorage(options.storage)
  const key = options.key ?? LEARNER_STORAGE_KEY
  const relatedKeys = options.relatedKeys ?? [LANGUAGE_STORAGE_KEY]
  const now = options.now ?? (() => new Date().toISOString())
  const changeEvents = options.changeEvents === undefined ? (typeof window !== 'undefined' ? window : null) : options.changeEvents
  const listeners = new Set<() => void>()
  // True while writes reach the device; false when storage is unavailable or a write has failed.
  let persistent = storage !== null

  function load(): LearnerRecord {
    if (!storage) return createEmptyRecord()
    try {
      const text = storage.getItem(key)
      if (!text) return createEmptyRecord()
      return migrateRecord(JSON.parse(text))
    } catch {
      return createEmptyRecord()
    }
  }

  let current: LearnerRecord = load()

  function persist(record: LearnerRecord): void {
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(record))
      persistent = true
    } catch (error) {
      // Full or blocked storage: keep working in memory for this session.
      persistent = false
      console.warn('MEX could not save learner data on this device.', error)
    }
  }

  function notify(): void {
    for (const listener of listeners) listener()
  }

  // Storage is shared by every tab of the same browser. When another tab changes
  // or deletes the record, re-read it so this tab never writes stale data back.
  if (storage && changeEvents) {
    changeEvents.addEventListener('storage', (event) => {
      const changedKey = (event as StorageEvent).key
      if (changedKey === null || changedKey === key) {
        current = load()
        notify()
      }
    })
  }

  return {
    get persistent() {
      return persistent
    },
    read() {
      return current
    },
    update(mutate) {
      const next = { ...mutate(current), schemaVersion: LEARNER_SCHEMA_VERSION, updatedAt: now() }
      current = next
      persist(next)
      notify()
      return next
    },
    reset() {
      current = createEmptyRecord()
      if (storage) {
        try {
          storage.removeItem(key)
          for (const related of relatedKeys) storage.removeItem(related)
        } catch (error) {
          console.warn('MEX could not clear learner data on this device.', error)
        }
      }
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
