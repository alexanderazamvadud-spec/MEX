import type { ButtonHTMLAttributes, ReactNode } from 'react'

// primary: the one main action of a screen. inverse: the main action inside a blue card or
// hero (white with blue text). secondary: a quieter white button with a thin border.
// outline-inverse: a quieter button on a blue surface (white outline, white text).
// selected: the chosen option in a group of toggle buttons (blue tint with a 2 px blue border).
export type ButtonVariant = 'primary' | 'inverse' | 'outline-inverse' | 'secondary' | 'selected' | 'tertiary' | 'destructive'
export type ButtonSize = 'lg' | 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

// 14 px corners (DESIGN-02, from the app mockup). The focus ring colour follows the
// surrounding surface through the --focus-ring variable (blue on light surfaces, white
// inside primary cards).
const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-button text-center leading-tight ' +
  'transition-colors duration-150 motion-reduce:transition-none select-none cursor-pointer ' +
  'disabled:cursor-not-allowed active:enabled:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'font-extrabold bg-primary text-on-primary hover:enabled:bg-primary-hover disabled:bg-surface-muted disabled:text-ink-muted',
  inverse:
    'font-extrabold bg-surface text-primary hover:enabled:bg-surface-sky disabled:bg-surface-muted disabled:text-ink-muted',
  'outline-inverse':
    'font-bold border border-on-primary-muted bg-transparent text-on-primary hover:enabled:bg-primary-hover disabled:text-on-primary-muted',
  secondary:
    'font-bold border border-divider bg-surface text-ink-secondary hover:enabled:bg-surface-soft-hover hover:enabled:text-ink ' +
    'disabled:bg-surface-muted disabled:text-ink-muted',
  selected:
    'font-extrabold border border-primary bg-surface-sky text-primary-hover shadow-[inset_0_0_0_1px_var(--color-primary)] ' +
    'hover:enabled:bg-surface-sky-hover disabled:bg-surface-muted disabled:text-ink-muted',
  tertiary:
    'font-extrabold bg-transparent text-primary hover:enabled:text-primary-hover hover:enabled:underline disabled:text-ink-muted',
  destructive:
    'font-bold border border-divider bg-surface text-error-text hover:enabled:bg-error-tint disabled:bg-surface-muted disabled:text-ink-muted',
}

// Minimum heights: 58 / 54 / 44 px. Every size meets the 44 px touch-target rule.
const sizeClasses: Record<ButtonSize, string> = {
  lg: 'min-h-[58px] px-6 text-[18px]',
  md: 'min-h-[54px] px-5 text-[16px]',
  sm: 'min-h-11 px-4 text-[14px]',
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
