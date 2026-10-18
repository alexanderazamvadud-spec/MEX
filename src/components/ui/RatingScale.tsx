import type { Confidence } from '../../learner/types.ts'

// A 1 to 5 scale of native radio buttons styled as pills, with a label under each end
// (MVP-13 confidence, MVP-14 usefulness). Optional: nothing is chosen until the learner taps.
const LEVELS: Confidence[] = [1, 2, 3, 4, 5]

export default function RatingScale({
  name,
  legend,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  name: string
  legend: string
  lowLabel: string
  highLabel: string
  value: Confidence | null
  onChange: (value: Confidence) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-body font-bold">{legend}</legend>
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
      <div className="flex justify-between gap-4 text-small text-ink-secondary">
        <span id={`${name}-low`}>{lowLabel}</span>
        <span id={`${name}-high`} className="text-right">
          {highLabel}
        </span>
      </div>
    </fieldset>
  )
}
