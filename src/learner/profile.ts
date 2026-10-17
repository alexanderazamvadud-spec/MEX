import type { Level, PathwayId } from '../content/types.ts'
import type { SupportedLanguage } from '../i18n/index.ts'
import type { Goal, LearnerProfile, LearnerRecord } from './types.ts'

// Goals in display order (Scope v2, SH-3).
export const GOALS: readonly Goal[] = ['everyday', 'study', 'work']

/** What onboarding has collected so far; null or empty means "not answered yet". */
export interface OnboardingAnswers {
  interfaceLanguage: SupportedLanguage
  level: Level | null
  goals: Goal[]
  pathway: PathwayId | null
}

/** Answers taken from an existing profile, so a returning learner sees their earlier choices. */
export function answersFromProfile(profile: LearnerProfile | null, interfaceLanguage: SupportedLanguage): OnboardingAnswers {
  return {
    interfaceLanguage,
    level: profile?.level ?? null,
    goals: profile ? GOALS.filter((goal) => profile.goals.includes(goal)) : [],
    pathway: profile?.pathway ?? null,
  }
}

export function isComplete(answers: OnboardingAnswers): answers is OnboardingAnswers & { level: Level; pathway: PathwayId } {
  return answers.level !== null && answers.goals.length > 0 && answers.pathway !== null
}

/**
 * Returns the record with the onboarding profile set. Only `profile` changes: completions,
 * results, self-assessments, ratings and preferences are kept as they are. A returning
 * learner keeps the original `createdAt`.
 */
export function withOnboardingProfile(
  record: LearnerRecord,
  answers: OnboardingAnswers & { level: Level; pathway: PathwayId },
  now: string,
): LearnerRecord {
  const profile: LearnerProfile = {
    interfaceLanguage: answers.interfaceLanguage,
    level: answers.level,
    goals: GOALS.filter((goal) => answers.goals.includes(goal)),
    pathway: answers.pathway,
    createdAt: record.profile?.createdAt ?? now,
    updatedAt: now,
  }
  return { ...record, profile }
}
