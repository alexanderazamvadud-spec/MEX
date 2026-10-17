import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

// "Back" at the top of the pathway and unit overviews: a 44 px link to the parent screen.
export default function BackLink({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <div className="-ml-1">
      <Link
        to={to}
        className="inline-flex min-h-11 items-center gap-1 rounded-pill px-1 text-body font-bold text-primary no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('learn.back')}
      </Link>
    </div>
  )
}
