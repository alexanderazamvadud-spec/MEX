import { useTranslation } from 'react-i18next'
import type { PathwayId } from '../../content/index.ts'
import { isHigher, readiness } from '../../learner/readiness.ts'
import { useLearner } from '../../learner/useLearner.ts'
import ButtonLink from '../ui/ButtonLink.tsx'
import HomeBlock from './HomeBlock.tsx'

// Block 2: readiness belongs to Career Readiness only and is always labelled
// "Self-assessment". Since MVP-15 it shows the level calculated by the pilot rules in
// learner/readiness.ts. General English learners keep the MVP-07 message (Q6 as built).
export default function CurrentReadiness({ pathway }: { pathway: PathwayId }) {
  const { t } = useTranslation()
  const { record } = useLearner()

  if (pathway !== 'career-readiness') {
    return (
      <HomeBlock title={t('home.readiness.title')} badge={t('home.readiness.label')} data-block="readiness">
        <p className="text-body">
          {t('home.readiness.generalEnglish', {
            career: t('landing.pathways.careerReadiness.name'),
            general: t('landing.pathways.generalEnglish.name'),
          })}
        </p>
      </HomeBlock>
    )
  }

  const level = readiness(record)
  return (
    <HomeBlock title={t('home.readiness.title')} badge={t('home.readiness.label')} data-block="readiness">
      <p className="text-h3 text-primary" data-level={level.level}>
        {t(`readiness.levels.${level.level}`)}
      </p>
      <p className="text-body">
        {level.sessionsFinished > 0 ? t('home.readiness.based', { n: level.sessionsFinished }) : t('home.readiness.careerEmpty')}
      </p>
      {isHigher(level.highest.level, level.level) ? (
        <p className="text-body text-ink-secondary" data-highest={level.highest.level}>
          {t('readiness.highest', { level: t(`readiness.levels.${level.highest.level}`) })}
        </p>
      ) : null}
      <div>
        <ButtonLink to="/progress" variant="secondary" size="sm">
          {t('home.readiness.seeProgress')}
        </ButtonLink>
      </div>
    </HomeBlock>
  )
}
