import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MatchingItem as Matching } from '../../content/types.ts'
import { pairResults, shuffled } from '../../learner/exercise.ts'
import { CheckIcon, CrossIcon } from '../icons/NavIcons.tsx'
import type { ItemViewProps } from './types.ts'

// Matching (MVP-10): each left-hand text has a native dropdown listing the right-hand texts
// in a fixed shuffled order, so it works by touch, keyboard and screen reader alike.
// After Check, each pair shows a check or a cross with a word, and a wrong pair shows its answer.
export default function MatchingItem({ item, answer, onChange, checked }: ItemViewProps<Matching>) {
  const { t } = useTranslation()
  const baseId = useId()
  const options = useMemo(() => shuffled(item.pairs.map((pair) => pair.right), `${item.id}:right`), [item])
  const values = answer.kind === 'matching' ? answer.values : item.pairs.map(() => null)
  const results = checked ? pairResults(item, answer) : null

  function choose(index: number, value: string) {
    onChange({ kind: 'matching', values: values.map((current, at) => (at === index ? value || null : current)) })
  }

  return (
    <ol className="flex flex-col gap-3">
      {item.pairs.map((pair, index) => {
        const id = `${baseId}-${index}`
        const right = results?.[index]
        return (
          <li
            key={pair.left}
            data-pair={index}
            className={[
              'flex flex-col gap-2 rounded-card p-4',
              right === true ? 'bg-success-tint' : right === false ? 'bg-error-tint' : 'bg-surface-soft',
            ].join(' ')}
          >
            <label htmlFor={id} lang="en" className="text-body font-bold">
              {pair.left}
            </label>
            <select
              id={id}
              lang="en"
              value={values[index] ?? ''}
              disabled={checked}
              onChange={(event) => choose(index, event.target.value)}
              className="min-h-11 w-full rounded-panel border-2 border-outline bg-surface px-3 text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) disabled:opacity-100"
            >
              <option value="">{t('exercise.chooseMatch')}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {right !== undefined && right !== null ? (
              <p className={['flex items-start gap-2 text-body font-bold', right ? 'text-success-text' : 'text-error-text'].join(' ')}>
                {right ? <CheckIcon width={20} height={20} className="mt-0.5 shrink-0" /> : <CrossIcon width={20} height={20} className="mt-0.5 shrink-0" />}
                <span>
                  {right ? t('exercise.correct') : t('exercise.incorrect')}
                  {right ? null : (
                    <>
                      {'. '}
                      <span className="font-normal">{t('exercise.answerIs', { answer: pair.right })}</span>
                    </>
                  )}
                </span>
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
