import { createContext } from 'react'
import type { LearnerStore } from './types.ts'

export const LearnerContext = createContext<LearnerStore | null>(null)
