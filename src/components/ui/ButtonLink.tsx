import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

export type ButtonLinkVariant = 'primary' | 'inverse' | 'secondary'
export type ButtonLinkSize = 'lg' | 'md' | 'sm'

// A navigation link that looks like a Button. Use it when the control moves to another
// screen, so the browser treats it as a link (new tab, copy link address, link lists in
// screen readers). Same shape, sizes and focus ring as Button; links are never disabled.
const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-button text-center leading-tight no-underline ' +
  'transition-colors duration-150 motion-reduce:transition-none select-none active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'

// The base `a` styles in index.css colour links blue on hover, so each variant restates its text colour.
const variantClasses: Record<ButtonLinkVariant, string> = {
  primary: 'font-extrabold bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary',
  inverse: 'font-extrabold bg-surface text-primary hover:bg-surface-sky hover:text-primary',
  secondary:
    'font-bold border border-divider bg-surface text-ink-secondary hover:bg-surface-soft-hover hover:text-ink',
}

const sizeClasses: Record<ButtonLinkSize, string> = {
  lg: 'min-h-[58px] px-6 text-[18px]',
  md: 'min-h-[54px] px-5 text-[16px]',
  sm: 'min-h-11 px-4 text-[14px]',
}

export interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonLinkVariant
  size?: ButtonLinkSize
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

export default function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <Link className={classes} {...rest}>
      {children}
    </Link>
  )
}
