import { useTranslation } from 'react-i18next'
import type { PathwayId } from '../../content/index.ts'
import HomeBlock from './HomeBlock.tsx'

// Block 2: readiness belongs to Career Readiness only and is always labelled
// "Self-assessment". MVP-07 shows no figure: the evidence (interview and speaking
// self-checks) is recorded by activities built in later tasks.
export default function CurrentReadiness({ pathway }: { pathway: PathwayId }) {
  const { t } = useTranslation()
  return (
    <HomeBlock title={t('home.readiness.title')} badge={t('home.readiness.label')} data-block="readiness">
      <p className="text-body">
        {pathway === 'career-readiness'
          ? t('home.readiness.careerEmpty')
          : t('home.readiness.generalEnglish', {
              career: t('landing.pathways.careerReadiness.name'),
              general: t('landing.pathways.generalEnglish.name'),
            })}
      </p>
    </HomeBlock>
  )
}
