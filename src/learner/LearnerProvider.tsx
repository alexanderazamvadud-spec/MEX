import { useMemo, type ReactNode } from 'react'
import { LearnerContext } from './context.ts'
import { createLocalLearnerStore } from './localStore.ts'
import type { LearnerStore } from './types.ts'

// Provides one store for the whole app. The default is the device-local store;
// a later account-backed store would be passed in here without touching screens.
export default function LearnerProvider({ store, children }: { store?: LearnerStore; children: ReactNode }) {
  const value = useMemo(() => store ?? createLocalLearnerStore(), [store])
  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
}
