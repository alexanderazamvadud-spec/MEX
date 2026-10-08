import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import LanguageButtons from '../components/navigation/LanguageButtons.tsx'
import Button from '../components/ui/Button.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'
import Wordmark from '../components/ui/Wordmark.tsx'

// Temporary placeholder shown until the landing page is built (MVP-06).
export default function PlaceholderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <PageContainer>
      <main className="flex flex-col gap-6 py-10">
        <Wordmark as="h1" />
        <p className="text-lead text-ink-secondary">{t('app.subtitle')}</p>
        <p className="text-body">{t('placeholder.status')}</p>
        <LanguageButtons />
        <div>
          <Button variant="secondary" onClick={() => navigate('/home')}>
            {t('placeholder.openApp')}
          </Button>
        </div>
      </main>
    </PageContainer>
  )
}
