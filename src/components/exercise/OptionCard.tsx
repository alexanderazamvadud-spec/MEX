import { CheckIcon, CrossIcon } from '../icons/NavIcons.tsx'

export type OptionMark = 'right' | 'wrong' | null

// One answer option as a whole-card radio button. The native input stays in the page,
// visually hidden, so keyboard use and screen-reader names come from the browser. After
// Check, the right option shows a check and a wrong choice a cross, never colour alone;
// the feedback panel below says the same in words.
export default function OptionCard({
  name,
  value,
  selected,
  mark,
  disabled,
  onSelect,
}: {
  name: string
  value: string
  selected: boolean
  mark: OptionMark
  disabled: boolean
  onSelect: () => void
}) {
  const background =
    mark === 'right'
      ? 'bg-success-tint'
      : mark === 'wrong'
        ? 'bg-error-tint'
        : selected
          ? 'bg-surface-sky'
          : disabled
            ? 'bg-surface-soft'
            : 'bg-surface-soft hover:bg-surface-soft-hover'
  const indicator =
    mark === 'right'
      ? 'border-success-border bg-success-border text-on-primary'
      : mark === 'wrong'
        ? 'border-error-border bg-error-border text-on-primary'
        : selected
          ? 'border-primary bg-primary text-on-primary'
          : 'border-outline bg-surface'
  return (
    <label
      data-mark={mark ?? undefined}
      className={[
        'flex min-h-14 items-start gap-3 rounded-card p-4 transition-colors duration-150 motion-reduce:transition-none',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring)',
        disabled ? 'cursor-default' : 'cursor-pointer',
        background,
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={['mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-pill border-2', indicator].join(' ')}
      >
        {mark === 'wrong' ? <CrossIcon width={16} height={16} /> : null}
        {mark === 'right' || (selected && !mark) ? <CheckIcon width={16} height={16} /> : null}
      </span>
      <span lang="en" className="text-body font-bold">
        {value}
      </span>
    </label>
  )
}
