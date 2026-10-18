import { useTranslation } from 'react-i18next'
import type { Confidence } from '../../learner/types.ts'

// Self-rated confidence (MVP-13): five native radio buttons in a row, 1 "Not yet" to 5 "Ready".
// It is optional; nothing chosen saves no confidence. The number is the learner's own view,
// never a score.
const LEVELS: Confidence[] = [1, 2, 3, 4, 5]

export default function ConfidenceScale({
  name,
  value,
  onChange,
}: {
  name: string
  value: Confidence | null
  onChange: (value: Confidence) => void
}) {
  const { t } = useTranslation()
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-body font-bold">{t('interview.confidence')}</legend>
      <div className="flex gap-2">
        {LEVELS.map((level) => (
          <label
            key={level}
            className={
              'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-pill border-2 text-body font-extrabold ' +
              'transition-colors duration-150 motion-reduce:transition-none ' +
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring) ' +
              (value === level
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline bg-surface hover:bg-surface-soft-hover')
            }
          >
            <input
              type="radio"
              name={name}
              value={level}
              checked={value === level}
              onChange={() => onChange(level)}
              className="sr-only"
              aria-describedby={level === 1 ? `${name}-low` : level === 5 ? `${name}-high` : undefined}
            />
            {level}
          </label>
        ))}
      </div>
      <div className="flex justify-between text-small text-ink-secondary">
        <span id={`${name}-low`}>{t('interview.notYet')}</span>
        <span id={`${name}-high`}>{t('interview.ready')}</span>
      </div>
    </fieldset>
  )
}
