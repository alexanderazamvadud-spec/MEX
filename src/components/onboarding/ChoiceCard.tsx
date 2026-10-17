import type { ChangeEvent } from 'react'
import { CheckIcon } from '../icons/NavIcons.tsx'

// A whole card that is one radio button or checkbox. The native input stays in the page
// (visually hidden), so keyboard use, form semantics and screen-reader names come from the
// browser. The choice is shown by a filled indicator with a checkmark, not by colour alone.
export default function ChoiceCard({
  type,
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: {
  type: 'radio' | 'checkbox'
  name: string
  value: string
  checked: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  title: string
  description?: string
}) {
  const indicatorShape = type === 'radio' ? 'rounded-pill' : 'rounded-[6px]'
  return (
    <label
      className={
        'flex min-h-14 cursor-pointer items-start gap-3 rounded-card p-4 transition-colors duration-150 motion-reduce:transition-none ' +
        'bg-surface-soft hover:bg-surface-soft-hover has-checked:bg-surface-sky has-checked:hover:bg-surface-sky-hover ' +
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring)'
      }
    >
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={[
          'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center border-2',
          indicatorShape,
          checked ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-surface',
        ].join(' ')}
      >
        {checked ? <CheckIcon width={16} height={16} /> : null}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-body font-extrabold">{title}</span>
        {description ? <span className="text-small text-ink-secondary">{description}</span> : null}
      </span>
    </label>
  )
}
