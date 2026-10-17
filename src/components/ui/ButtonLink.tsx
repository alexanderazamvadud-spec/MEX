import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

export type ButtonLinkVariant = 'primary' | 'accent' | 'secondary'
export type ButtonLinkSize = 'lg' | 'md' | 'sm'

// A navigation link that looks like a Button. Use it when the control moves to another
// screen, so the browser treats it as a link (new tab, copy link address, link lists in
// screen readers). Same shape, sizes and focus ring as Button; links are never disabled.
const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill font-extrabold text-center leading-tight no-underline ' +
  'transition-colors duration-150 motion-reduce:transition-none select-none active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)'

// The base `a` styles in index.css colour links blue on hover, so each variant restates its text colour.
const variantClasses: Record<ButtonLinkVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary',
  accent: 'bg-accent text-on-accent hover:bg-accent-hover hover:text-on-accent',
  secondary: 'bg-surface-sky text-primary hover:bg-track hover:text-primary',
}

const sizeClasses: Record<ButtonLinkSize, string> = {
  lg: 'min-h-14 px-7 text-[16px]',
  md: 'min-h-13 px-6 text-[15px]',
  sm: 'min-h-11 px-4 text-[13px]',
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
