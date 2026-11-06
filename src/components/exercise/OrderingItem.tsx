import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrderingItem as Ordering } from '../../content/types.ts'
import { shuffled } from '../../learner/exercise.ts'
import Button from '../ui/Button.tsx'
import type { ItemViewProps } from './types.ts'

// Ordering (MVP-10): the parts are shown in a fixed shuffled order as buttons. Tapping one
// adds it to the answer line, tapping a placed part puts it back, and "Start again" clears
// the line. There is no drag and drop, so it works by keyboard and screen reader too.
// Look (DESIGN-02): 12 px chips; placed parts blue, unplaced parts white with a thin border.

const partClasses =
  'inline-flex min-h-12 items-center rounded-panel px-4 text-lead font-bold transition-colors duration-150 motion-reduce:transition-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) disabled:cursor-default'

export default function OrderingItem({ item, answer, onChange, checked }: ItemViewProps<Ordering>) {
  const { t } = useTranslation()
  const pool = useMemo(() => shuffled(item.segments, item.id), [item])
  const placed = answer.kind === 'ordering' ? answer.values : []

  // Which shuffled parts are still unplaced. Counting handles a part that appears twice.
  const remaining = new Map<string, number>()
  for (const value of placed) remaining.set(value, (remaining.get(value) ?? 0) + 1)
  const unplaced = pool.map((segment, index) => {
    const used = remaining.get(segment) ?? 0
    if (used > 0) {
      remaining.set(segment, used - 1)
      return null
    }
    return { segment, index }
  })

  return (
    <div className="flex flex-col gap-4">
      <ol
        lang="en"
        aria-label={t('exercise.yourAnswer')}
        className="flex min-h-16 flex-wrap items-center gap-2 rounded-card border-2 border-dashed border-dash-line bg-surface p-3"
      >
        {placed.map((segment, index) => (
          <li key={`${segment}-${index}`}>
            <button
              type="button"
              disabled={checked}
              onClick={() => onChange({ kind: 'ordering', values: placed.filter((_, at) => at !== index) })}
              className={`${partClasses} bg-primary text-on-primary hover:enabled:bg-primary-hover`}
            >
              {segment}
            </button>
          </li>
        ))}
      </ol>
      {checked ? null : (
        <>
          <ul lang="en" className="flex flex-wrap gap-2">
            {unplaced.map((part) =>
              part ? (
                <li key={part.index}>
                  <button
                    type="button"
                    onClick={() => onChange({ kind: 'ordering', values: [...placed, part.segment] })}
                    className={`${partClasses} border border-divider bg-surface text-ink hover:bg-surface-soft-hover`}
                  >
                    {part.segment}
                  </button>
                </li>
              ) : null,
            )}
          </ul>
          <div>
            <Button
              variant="tertiary"
              size="sm"
              disabled={placed.length === 0}
              onClick={() => onChange({ kind: 'ordering', values: [] })}
            >
              {t('exercise.startAgain')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
