import { useTranslation } from 'react-i18next'

// Temporary screen body shown until the real screen is built in a later task.
export default function StubPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-h1">{t(titleKey)}</h1>
      <p className="text-body text-ink-secondary">{t('stub.comingSoon')}</p>
    </div>
  )
}
