// MEX content model (Scope v2, Section 5). Teaching content is English; the
// optional uz/ru fields hold native-language explanations and instructions that
// the learner can switch on or off (decision Q3). Every item carries its own
// id, skill tags, level, content status and licence so real content can later
// replace placeholder content item by item.

export type PathwayId = 'general-english' | 'career-readiness'

// Plain-word levels only (decision Q9): MEX has not tested anyone's level, so no CEFR codes.
export type Level = 'beginner' | 'elementary' | 'intermediate'

export type Skill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'interaction'

export type ContentStatus = 'placeholder' | 'draft' | 'approved'

export type License = 'placeholder' | 'mex-proprietary' | 'open'

export type ActivityType =
  | 'lesson'
  | 'exercise'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'interview-practice'
  | 'writing-checklist'

/** English is required; Uzbek and Russian are optional native-language versions. */
export interface LocalizedText {
  en: string
  uz?: string
  ru?: string
}

export interface ItemBase {
  id: string
  skills: Skill[]
  level: Level
  content_status: ContentStatus
  license: License
}

// Lesson items
export interface PhraseItem extends ItemBase {
  kind: 'phrase'
  phrase: string
  example: string
  note?: LocalizedText
}

export interface GrammarNoteItem extends ItemBase {
  kind: 'grammar-note'
  title: string
  explanation: LocalizedText
  examples: string[]
}

export interface DialogueItem extends ItemBase {
  kind: 'dialogue'
  title: string
  lines: Array<{ speaker: string; text: string }>
}

// Exercise items (auto-checked)
export interface MultipleChoiceItem extends ItemBase {
  kind: 'multiple-choice'
  prompt: string
  options: string[]
  answer: string
  explanation: LocalizedText
}

export interface GapFillItem extends ItemBase {
  kind: 'gap-fill'
  /** The sentence with ___ marking the gap. */
  sentence: string
  options: string[]
  answer: string
  explanation: LocalizedText
}

export interface MatchingItem extends ItemBase {
  kind: 'matching'
  prompt: string
  pairs: Array<{ left: string; right: string }>
  explanation: LocalizedText
}

export interface OrderingItem extends ItemBase {
  kind: 'ordering'
  prompt: string
  /** Segments in the correct order; the player shuffles them. */
  segments: string[]
  explanation: LocalizedText
}

export interface ComprehensionQuestion {
  prompt: string
  options: string[]
  answer: string
  explanation: LocalizedText
}

export interface ReadingItem extends ItemBase {
  kind: 'reading'
  title: string
  text: string
  questions: ComprehensionQuestion[]
}

export interface ListeningItem extends ItemBase {
  kind: 'listening'
  title: string
  /** Text to be read aloud by the device (decision Q5 pending). */
  transcript: string
  questions: ComprehensionQuestion[]
}

// Self-assessed items
export interface SpeakingItem extends ItemBase {
  kind: 'speaking'
  prompt: LocalizedText
  preparationHints: string[]
  modelAnswer: string
  selfCheck: LocalizedText[]
}

export interface InterviewQuestionItem extends ItemBase {
  kind: 'interview-question'
  question: string
  modelAnswers: string[]
  usefulPhrases: string[]
  selfCheck: LocalizedText[]
}

export interface WritingTaskItem extends ItemBase {
  kind: 'writing-task'
  task: LocalizedText
  model: string
  checklist: LocalizedText[]
}

export type ContentItem =
  | PhraseItem
  | GrammarNoteItem
  | DialogueItem
  | MultipleChoiceItem
  | GapFillItem
  | MatchingItem
  | OrderingItem
  | ReadingItem
  | ListeningItem
  | SpeakingItem
  | InterviewQuestionItem
  | WritingTaskItem

export interface Activity {
  id: string
  type: ActivityType
  title: string
  instructions: LocalizedText
  skills: Skill[]
  estimatedMinutes: number
  items: ContentItem[]
}

export interface Unit {
  id: string
  title: string
  summary: LocalizedText
  estimatedMinutes: number
  activities: Activity[]
}

export interface ContentPack {
  id: string
  pathway: PathwayId
  title: string
  description: LocalizedText
  level: Level
  content_status: ContentStatus
  license: License
  units: Unit[]
}

/** Which item kinds each activity type may contain. Enforced by scripts/check-content.mjs. */
export const ITEM_KINDS_BY_ACTIVITY: Record<ActivityType, ReadonlyArray<ContentItem['kind']>> = {
  lesson: ['phrase', 'grammar-note', 'dialogue'],
  exercise: ['multiple-choice', 'gap-fill', 'matching', 'ordering'],
  reading: ['reading'],
  listening: ['listening'],
  speaking: ['speaking'],
  'interview-practice': ['interview-question'],
  'writing-checklist': ['writing-task'],
}
