import { useId, type ReactNode } from 'react'
import Badge from '../ui/Badge.tsx'
import Card, { type CardVariant } from '../ui/Card.tsx'

// Shared frame for the four Home blocks: a white card with a level-2 heading and an
// optional label badge ("Sample content", "Self-assessment") beside it. Today's mission
// uses the blue variant so it is the screen's one dominant block (DESIGN-02).
export default function HomeBlock({
  title,
  badge,
  busy = false,
  variant = 'soft',
  children,
  ...rest
}: {
  title: string
  badge?: string
  busy?: boolean
  variant?: Extract<CardVariant, 'soft' | 'primary'>
  children?: ReactNode
  'data-block'?: string
}) {
  const headingId = useId()
  return (
    <Card as="section" variant={variant} className="gap-3 p-5" aria-labelledby={headingId} aria-busy={busy || undefined} {...rest}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-h3">
          {title}
        </h2>
        {badge ? <Badge variant={variant === 'primary' ? 'surface' : 'sky'}>{badge}</Badge> : null}
      </div>
      {children}
    </Card>
  )
}
