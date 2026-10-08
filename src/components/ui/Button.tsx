import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'tertiary' | 'destructive'
export type ButtonSize = 'lg' | 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

// Pill-shaped buttons. The focus ring colour follows the surrounding surface
// through the --focus-ring variable (blue on light surfaces, white inside primary cards).
const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill font-extrabold text-center leading-tight ' +
  'transition-colors duration-150 motion-reduce:transition-none select-none cursor-pointer ' +
  'disabled:cursor-not-allowed active:enabled:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:enabled:bg-primary-hover disabled:bg-surface-soft disabled:text-ink-muted',
  accent: 'bg-accent text-on-accent hover:enabled:bg-accent-hover disabled:bg-surface-soft disabled:text-ink-muted',
  secondary: 'bg-surface-sky text-primary hover:enabled:bg-track disabled:bg-surface-soft disabled:text-ink-muted',
  tertiary: 'bg-transparent text-primary hover:enabled:text-primary-hover hover:enabled:underline disabled:text-ink-muted',
  destructive:
    'bg-error-tint text-error-text hover:enabled:bg-error-tint-hover disabled:bg-surface-soft disabled:text-ink-muted',
}

// Minimum heights: 56 / 52 / 44 px. Every size meets the 44 px touch-target rule.
const sizeClasses: Record<ButtonSize, string> = {
  lg: 'min-h-14 px-7 text-[16px]',
  md: 'min-h-13 px-6 text-[15px]',
  sm: 'min-h-11 px-4 text-[13px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-pill border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  )
}
