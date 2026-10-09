import { useContext, useSyncExternalStore } from 'react'
import { LearnerContext } from './context.ts'
import type { LearnerRecord, LearnerStore } from './types.ts'

export interface LearnerApi {
  record: LearnerRecord
  update: LearnerStore['update']
  reset: LearnerStore['reset']
  persistent: boolean
}

// Screens read the learner record and change it only through this hook.
export function useLearner(): LearnerApi {
  const store = useContext(LearnerContext)
  if (!store) {
    throw new Error('useLearner must be used inside LearnerProvider.')
  }
  const record = useSyncExternalStore(store.subscribe, store.read, store.read)
  return { record, update: store.update, reset: store.reset, persistent: store.persistent }
}
