import { useTranslation } from 'react-i18next'
import DeleteDataControl from '../components/settings/DeleteDataControl.tsx'

// Settings: only the data-deletion control exists so far; the full screen comes in MVP-17.
export default function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.settings')}</h1>
      <p className="text-body text-ink-secondary">{t('stub.comingSoon')}</p>
      <DeleteDataControl />
    </div>
  )
}
