import { useId, type ReactNode } from 'react'
import Badge from '../ui/Badge.tsx'
import Card from '../ui/Card.tsx'

// Shared frame for the four Home blocks: a soft card with a level-2 heading and an
// optional label badge ("Sample content", "Self-assessment") beside it.
export default function HomeBlock({
  title,
  badge,
  busy = false,
  children,
  ...rest
}: {
  title: string
  badge?: string
  busy?: boolean
  children?: ReactNode
  'data-block'?: string
}) {
  const headingId = useId()
  return (
    <Card as="section" variant="soft" className="gap-3 p-5" aria-labelledby={headingId} aria-busy={busy || undefined} {...rest}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-h3">
          {title}
        </h2>
        {badge ? <Badge variant="sky">{badge}</Badge> : null}
      </div>
      {children}
    </Card>
  )
}
