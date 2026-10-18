import { useTranslation } from 'react-i18next'
import type { Confidence } from '../../learner/types.ts'
import RatingScale from '../ui/RatingScale.tsx'

// Self-rated confidence (MVP-13): 1 "Not yet" to 5 "Ready". It is optional; nothing chosen
// saves no confidence. The number is the learner's own view, never a score.
export default function ConfidenceScale({
  name,
  value,
  onChange,
}: {
  name: string
  value: Confidence | null
  onChange: (value: Confidence) => void
}) {
  const { t } = useTranslation()
  return (
    <RatingScale
      name={name}
      legend={t('interview.confidence')}
      lowLabel={t('interview.notYet')}
      highLabel={t('interview.ready')}
      value={value}
      onChange={onChange}
    />
  )
}
