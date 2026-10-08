import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export type CardVariant = 'soft' | 'sky' | 'primary' | 'accent-tint'

// 24 px corners, no border, no shadow. Tinted surfaces separate cards from the white page.
const baseClasses = 'flex flex-col gap-2.5 rounded-card p-4'

const variantClasses: Record<CardVariant, string> = {
  soft: 'bg-surface-soft text-ink',
  sky: 'bg-surface-sky text-ink',
  // Inside a primary card the focus ring of child controls switches to white.
  primary: 'bg-primary text-on-primary [--focus-ring:var(--color-on-primary)]',
  'accent-tint': 'bg-accent-tint text-ink',
}

const hoverClasses: Record<CardVariant, string> = {
  soft: 'hover:bg-surface-soft-hover',
  sky: 'hover:bg-surface-sky-hover',
  primary: 'hover:bg-primary-hover',
  'accent-tint': 'hover:bg-accent-tint-hover',
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  as?: 'div' | 'section' | 'article' | 'li'
  children: ReactNode
}

export default function Card({ variant = 'soft', as: Tag = 'div', className = '', children, ...rest }: CardProps) {
  return (
    <Tag className={[baseClasses, variantClasses[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  )
}

export interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CardVariant
  children: ReactNode
}

// A whole card that acts as one button (for example a tappable unit or pathway).
// A primary card sits on a light page, so its own ring stays blue.
export function CardButton({ variant = 'soft', className = '', type = 'button', children, ...rest }: CardButtonProps) {
  const ringClass = variant === 'primary' ? 'focus-visible:outline-primary' : 'focus-visible:outline-(--focus-ring)'
  const classes = [
    baseClasses,
    variantClasses[variant],
    hoverClasses[variant],
    'w-full cursor-pointer text-left transition-colors duration-150 motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    ringClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
