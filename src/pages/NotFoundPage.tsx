import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button.tsx'

// Shown for any hash route that does not exist.
export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('notFound.title')}</h1>
      <p className="text-body text-ink-secondary">{t('notFound.body')}</p>
      <div>
        <Button onClick={() => navigate('/home')}>{t('notFound.cta')}</Button>
      </div>
    </div>
  )
}
