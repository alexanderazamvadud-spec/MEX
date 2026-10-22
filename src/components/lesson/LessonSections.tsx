import { useTranslation } from 'react-i18next'
import type { DialogueItem, GrammarNoteItem, PhraseItem } from '../../content/types.ts'
import Card from '../ui/Card.tsx'
import NativeText from './NativeText.tsx'

// The three kinds of lesson content (Scope v2 S8). Teaching content is English and marked
// lang="en"; only notes and explanations have native-language versions.

type Native = 'uz' | 'ru' | null

function Label({ children }: { children: string }) {
  return <p className="text-label uppercase text-ink-muted">{children}</p>
}

export function PhraseList({ items, native }: { items: PhraseItem[]; native: Native }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="lesson-phrases" className="flex flex-col gap-3">
      <h2 id="lesson-phrases" className="text-h2">
        {t('lesson.phrases')}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} as="li" variant="soft" className="gap-2" data-item={item.id}>
            <p lang="en" className="text-h3">
              {item.phrase}
            </p>
            <div className="flex flex-col gap-0.5">
              <Label>{t('lesson.example')}</Label>
              <p lang="en" className="text-body">
                {item.example}
              </p>
            </div>
            {item.note ? (
              <div className="flex flex-col gap-1">
                <Label>{t('lesson.note')}</Label>
                <p lang="en" className="text-body">
                  {item.note.en}
                </p>
                <NativeText text={item.note} language={native} />
              </div>
            ) : null}
          </Card>
        ))}
      </ul>
    </section>
  )
}

export function GrammarNote({ item, native }: { item: GrammarNoteItem; native: Native }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby={`lesson-${item.id}`} className="flex flex-col gap-3" data-item={item.id}>
      <h2 id={`lesson-${item.id}`} className="text-h2">
        {t('lesson.grammar')}
      </h2>
      <Card variant="sky" className="gap-3 p-5">
        <h3 lang="en" className="text-h3">
          {item.title}
        </h3>
        <p lang="en" className="text-body">
          {item.explanation.en}
        </p>
        <NativeText text={item.explanation} language={native} />
        <div className="flex flex-col gap-1">
          <Label>{t('lesson.examples')}</Label>
          <ul lang="en" className="flex list-disc flex-col gap-1 pl-5 text-body">
            {item.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      </Card>
    </section>
  )
}

export function Dialogue({ item }: { item: DialogueItem }) {
  const { t } = useTranslation()
  return (
    // The section name includes the dialogue title, so two dialogues in one lesson have different names (MVP-16b).
    <section aria-labelledby={`lesson-${item.id} lesson-${item.id}-title`} className="flex flex-col gap-3" data-item={item.id}>
      <h2 id={`lesson-${item.id}`} className="text-h2">
        {t('lesson.dialogue')}
      </h2>
      <Card variant="soft" className="gap-3 p-5">
        <h3 id={`lesson-${item.id}-title`} lang="en" className="text-h3">
          {item.title}
        </h3>
        <ol lang="en" className="flex flex-col gap-3">
          {item.lines.map((line, index) => (
            <li key={index} className="flex flex-col gap-0.5">
              <span className="text-small font-bold text-primary">{line.speaker}</span>
              <span className="text-body">{line.text}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  )
}
