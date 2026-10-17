import type { ActivityType, PathwayId } from '../../content/index.ts'

// Translation key segments for content ids. Pathway names and descriptions are the
// approved MVP-06 texts under landing.pathways.*.
export const PATHWAY_KEYS: Record<PathwayId, string> = {
  'general-english': 'generalEnglish',
  'career-readiness': 'careerReadiness',
}

export const ACTIVITY_TYPE_KEYS: Record<ActivityType, string> = {
  lesson: 'lesson',
  exercise: 'exercise',
  reading: 'reading',
  listening: 'listening',
  speaking: 'speaking',
  'interview-practice': 'interviewPractice',
  'writing-checklist': 'writingChecklist',
}
