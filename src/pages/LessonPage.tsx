import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BackLink from '../components/learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../components/learn/text.ts'
import { Dialogue, GrammarNote, PhraseList } from '../components/lesson/LessonSections.tsx'
import NativeText from '../components/lesson/NativeText.tsx'
import ActivitySummary from '../components/summary/ActivitySummary.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import Switch from '../components/ui/Switch.tsx'
import { isPlaceholder } from '../content/index.ts'
import type { ContentItem, PhraseItem } from '../content/types.ts'
import { LANGUAGE_NAMES } from '../i18n/index.ts'
import { explanationsOn, withCompletion, withNativeExplanations } from '../learner/lesson.ts'
import { completedActivityIds } from '../learner/progress.ts'
import { useLearner } from '../learner/useLearner.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Lesson viewer (MVP-09, Scope v2 screen S8), shown by ActivityPage at
// #/learn/:pathway/:unit/:activity for lesson activities: key phrases, grammar notes and dialogues in pack order. Teaching
// content stays English. With Uzbek or Russian as the interface language, a switch shows
// that language's version of the instructions, notes and explanations under the English
// (decision Q3: on by default for Beginner); with English there is nothing to translate,
// so the switch is hidden. "Finish lesson" records one completion and returns to the unit.

type Section =
  | { kind: 'phrases'; items: PhraseItem[] }
  | { kind: 'grammar-note'; item: Extract<ContentItem, { kind: 'grammar-note' }> }
  | { kind: 'dialogue'; item: Extract<ContentItem, { kind: 'dialogue' }> }

// Consecutive phrases form one "Key phrases" section; every other item is its own section.
function toSections(items: ContentItem[]): Section[] {
  const sections: Section[] = []
  for (const item of items) {
    if (item.kind === 'phrase') {
      const last = sections.at(-1)
      if (last?.kind === 'phrases') last.items.push(item)
      else sections.push({ kind: 'phrases', items: [item] })
    } else if (item.kind === 'grammar-note' || item.kind === 'dialogue') {
      sections.push({ kind: item.kind, item } as Section)
    }
  }
  return sections
}

export default function LessonPage({ pathway, pack, unit, activity }: ActivityPageProps) {
  const { t, i18n } = useTranslation()
  const { record, update } = useLearner()
  const [done, setDone] = useState(false)

  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const showNative = nativeLanguage !== null && explanationsOn(record)
  const native = showNative ? nativeLanguage : null
  const completed = completedActivityIds(pathway, record.completions).has(activity.id)
  const unitPath = `/learn/${pathway}/${unit.id}`

  function finish() {
    const now = new Date().toISOString()
    update((current) => withCompletion(current, { pathway, unitId: unit.id, activityId: activity.id }, now))
    setDone(true)
  }

  if (done) {
    return (
      <ActivitySummary pathway={pathway} pack={pack} unit={unit} activity={activity} recap={<p>{t('summary.lessonRecap')}</p>} />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink to={unitPath} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 empty:hidden">
          {isPlaceholder(pack.content_status) ? <Badge variant="sky">{t('home.sampleContent')}</Badge> : null}
          {completed ? <Badge variant="success">{t('learn.done')}</Badge> : null}
        </div>
        <h1 lang="en" className="text-h1">
          {activity.title}
        </h1>
        <p className="text-small text-ink-secondary">
          {t(`learn.types.${ACTIVITY_TYPE_KEYS[activity.type]}`)} · {t('learn.minutes', { n: activity.estimatedMinutes })}
        </p>
      </div>

      {nativeLanguage ? (
        <div className="rounded-panel bg-surface-soft px-4 py-3">
          <Switch
            checked={showNative}
            onChange={(on) => update((current) => withNativeExplanations(current, on))}
            label={t('lesson.toggle', { language: LANGUAGE_NAMES[nativeLanguage] })}
            hint={t('lesson.toggleHint')}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p lang="en" className="text-body">
          {activity.instructions.en}
        </p>
        <NativeText text={activity.instructions} language={native} />
      </div>

      {toSections(activity.items).map((section) =>
        section.kind === 'phrases' ? (
          <PhraseList key={section.items[0].id} items={section.items} native={native} />
        ) : section.kind === 'grammar-note' ? (
          <GrammarNote key={section.item.id} item={section.item} native={native} />
        ) : (
          <Dialogue key={section.item.id} item={section.item} />
        ),
      )}

      <div>
        <Button variant="accent" size="lg" onClick={finish}>
          {t('lesson.finish')}
        </Button>
      </div>
    </div>
  )
}
