import { useTranslation } from 'react-i18next'
import Button from './Button.tsx'
import Card from './Card.tsx'

// Shown when a content pack could not load, for example because the connection dropped
// (MVP-17). "Try again" reloads the page: browsers remember a failed module load until a
// reload. Saved progress is on the device and is not affected. With `pageTitle` it fills
// a whole screen and gives it its h1.
export default function ContentLoadError({
  onRetry = () => window.location.reload(),
  pageTitle,
}: {
  onRetry?: () => void
  pageTitle?: string
}) {
  const { t } = useTranslation()
  const card = (
    <Card variant="soft" className="gap-3 p-5" role="alert" data-content-error>
      <p className="text-body">{t('app.contentError')}</p>
      <div>
        <Button variant="primary" size="sm" onClick={onRetry}>
          {t('app.tryAgain')}
        </Button>
      </div>
    </Card>
  )
  if (!pageTitle) return card
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{pageTitle}</h1>
      {card}
    </div>
  )
}
