import { useId, type ReactNode } from 'react'
import Card from '../ui/Card.tsx'

// One Settings part: a soft card with a level-2 heading (MVP-17).
export default function SettingsSection({ title, children, ...rest }: { title: string; children: ReactNode; 'data-section': string }) {
  const headingId = useId()
  return (
    <Card as="section" variant="soft" className="gap-3 p-5" aria-labelledby={headingId} {...rest}>
      <h2 id={headingId} className="text-h3">
        {title}
      </h2>
      {children}
    </Card>
  )
}
