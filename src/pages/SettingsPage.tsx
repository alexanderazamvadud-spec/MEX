import { Trans, useTranslation } from 'react-i18next'
import { BUILD_INFO } from '../buildInfo.ts'
import PathwaySwitch from '../components/home/PathwaySwitch.tsx'
import { PATHWAY_KEYS } from '../components/learn/text.ts'
import LanguageButtons from '../components/navigation/LanguageButtons.tsx'
import { formatDay } from '../components/progress/format.ts'
import DeleteDataControl from '../components/settings/DeleteDataControl.tsx'
import SettingsSection from '../components/settings/SettingsSection.tsx'
import Switch from '../components/ui/Switch.tsx'
import { PATHWAY_IDS, type PathwayId } from '../content/index.ts'
import { LANGUAGE_NAMES } from '../i18n/index.ts'
import { explanationsOn, withNativeExplanations } from '../learner/lesson.ts'
import { withPathway } from '../learner/profile.ts'
import { useLearner } from '../learner/useLearner.ts'

// Settings (MVP-17, Scope v2 screen S16): interface language, active pathway, the
// native-explanation switch, the learner's data and About, in that order. Nothing here
// is the screen's main step, so it has no saffron action. Settings is open without a
// profile (so "Delete my data" can confirm its result), and then the pathway part is hidden.
export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { record, update, persistent } = useLearner()
  const pathway = record.profile?.pathway ?? null
  const language = i18n.resolvedLanguage
  const nativeLanguage = language === 'uz' || language === 'ru' ? language : null
  const other = PATHWAY_IDS.find((item) => item !== pathway) ?? PATHWAY_IDS[0]

  function switchTo(to: PathwayId) {
    const now = new Date().toISOString()
    update((current) => withPathway(current, to, now))
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.settings')}</h1>

      <SettingsSection title={t('language.label')} data-section="language">
        <LanguageButtons />
      </SettingsSection>

      {pathway ? (
        <SettingsSection title={t('home.pathway.title')} data-section="pathway">
          <p className="text-h3 text-primary">{t(`landing.pathways.${PATHWAY_KEYS[pathway]}.name`)}</p>
          <PathwaySwitch
            pathway={pathway}
            onSwitch={switchTo}
            label={t('settings.pathwaySwitchTo', { pathway: t(`landing.pathways.${PATHWAY_KEYS[other]}.name`) })}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title={t('settings.explanationsTitle')} data-section="explanations">
        {nativeLanguage ? (
          <Switch
            checked={explanationsOn(record)}
            onChange={(on) => update((current) => withNativeExplanations(current, on))}
            label={t('lesson.toggle', { language: LANGUAGE_NAMES[nativeLanguage] })}
            hint={t('lesson.toggleHint')}
          />
        ) : (
          <p className="text-body text-ink-secondary">
            <Trans i18nKey="settings.explanationsEnglish" components={{ uz: <span lang="uz" />, ru: <span lang="ru" /> }} />
          </p>
        )}
      </SettingsSection>

      {!persistent ? (
        <p role="status" className="rounded-panel bg-warning-tint px-4 py-3 text-body text-warning-text" data-storage-notice>
          {t('onboarding.storageNotice')}
        </p>
      ) : null}
      <DeleteDataControl />

      <SettingsSection title={t('settings.aboutTitle')} data-section="about">
        <p className="text-body">{t('settings.aboutBody')}</p>
        <p className="text-small text-ink-secondary" data-version>
          {t('settings.version', { version: BUILD_INFO.version, commit: BUILD_INFO.commit, date: formatDay(`${BUILD_INFO.date}T12:00:00`, language) })}
        </p>
      </SettingsSection>
    </div>
  )
}
