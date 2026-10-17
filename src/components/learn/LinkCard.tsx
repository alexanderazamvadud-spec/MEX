import type { ReactNode } from 'react'
import { Link } from 'react-router'

// A whole card that is one link to another screen (pathway cards, unit rows).
// Same corners and tints as Card; the base link colour is restated so hover keeps the ink colour.
const variantClasses = {
  sky: 'bg-surface-sky hover:bg-surface-sky-hover',
  soft: 'bg-surface-soft hover:bg-surface-soft-hover',
} as const

export default function LinkCard({
  to,
  variant = 'soft',
  className = '',
  children,
}: {
  to: string
  variant?: keyof typeof variantClasses
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={[
        'flex flex-col gap-2.5 rounded-card p-5 font-normal text-ink no-underline hover:text-ink',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
