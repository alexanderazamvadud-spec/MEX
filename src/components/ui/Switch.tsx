import { useId } from 'react'

// An on/off switch: a native checkbox with role="switch", visually hidden, inside a
// 44 px label. The track is primary blue when on and white with an outline when off,
// and the thumb moves, so the state is never shown by colour alone.
export default function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  const labelId = useId()
  const hintId = useId()
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-panel has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring)">
      <span className="flex flex-col gap-0.5">
        <span id={labelId} className="text-body font-bold">
          {label}
        </span>
        {hint ? (
          <span id={hintId} className="text-small text-ink-secondary">
            {hint}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
      />
      <span
        aria-hidden="true"
        className={[
          'inline-flex h-7 w-12 shrink-0 items-center rounded-pill border-2 transition-colors duration-150 motion-reduce:transition-none',
          checked ? 'border-primary bg-primary' : 'border-outline bg-surface',
        ].join(' ')}
      >
        <span
          className={[
            'size-5 rounded-pill transition-transform duration-150 motion-reduce:transition-none',
            checked ? 'translate-x-[22px] bg-on-primary' : 'translate-x-0.5 bg-outline',
          ].join(' ')}
        />
      </span>
    </label>
  )
}
