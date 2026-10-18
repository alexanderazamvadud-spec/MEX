import { useTranslation } from 'react-i18next'
import type { Readiness } from '../../learner/readiness.ts'
import { formatAverage, formatDay } from './format.ts'

// The readiness layer on the Progress screen (MVP-15): the level, how it is calculated,
// the highest level reached, and the evidence behind it. Career Readiness only and
// always shown with the "Self-assessment" label by the section around it.
export default function ReadinessDetails({ readiness }: { readiness: Readiness }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage
  const { recent, highest } = readiness
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-small text-ink-secondary">{t('readiness.current')}</p>
        <p className="text-h3 text-primary" data-level={readiness.level}>
          {t(`readiness.levels.${readiness.level}`)}
        </p>
      </div>
      <p className="text-body">{t('readiness.how')}</p>
      <p className="text-body text-ink-secondary">{t('readiness.ownView')}</p>
      <p className="text-body font-bold" data-highest={highest.level}>
        {highest.reachedAt
          ? t('readiness.highestOn', { level: t(`readiness.levels.${highest.level}`), date: formatDay(highest.reachedAt, language) })
          : t('readiness.highest', { level: t(`readiness.levels.${highest.level}`) })}
      </p>
      <ul className="flex flex-col gap-1.5 text-body" data-evidence>
        <li>{t('readiness.sessions', { n: readiness.sessionsFinished })}</li>
        {recent.sessions > 0 ? (
          <>
            <li>
              {recent.averageConfidence === null
                ? t('readiness.notRated')
                : t('readiness.confidence', { value: formatAverage(recent.averageConfidence, language) })}
            </li>
            <li>{t('readiness.ticked', { ticked: recent.ticked, boxes: recent.boxes })}</li>
          </>
        ) : null}
      </ul>
      <div className="flex flex-col gap-1" data-speaking>
        <p className="text-body">{t('readiness.speaking', { n: readiness.speakingDone })}</p>
        <p className="text-small text-ink-secondary">{t('readiness.speakingNote')}</p>
      </div>
    </>
  )
}
