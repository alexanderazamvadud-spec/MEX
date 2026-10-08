import type { ReactNode } from 'react'

// Phone-first page column: 18 px side padding, centred and capped at 560 px on larger screens.
export default function PageContainer({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={['mx-auto w-full max-w-page px-gutter', className].filter(Boolean).join(' ')}>{children}</div>
}
