import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'neutral' | 'accent-tint' | 'primary' | 'sky' | 'surface' | 'success' | 'error'

// Small pill labels such as "Sample content" or "Self-assessment". Not interactive.
// neutral (grey) is for quiet states on white cards, such as Not started (DESIGN-02).
const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-muted text-ink-secondary',
  'accent-tint': 'bg-accent-tint text-on-accent-tint',
  primary: 'bg-primary text-on-primary',
  sky: 'bg-surface-sky text-primary',
  surface: 'bg-surface text-primary',
  success: 'bg-success-tint text-success-text',
  error: 'bg-error-tint text-error-text',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

export default function Badge({ variant = 'accent-tint', className = '', children, ...rest }: BadgeProps) {
  const classes = [
    'inline-flex items-center rounded-pill px-2.5 py-1 text-[13px] leading-tight font-bold whitespace-nowrap',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
