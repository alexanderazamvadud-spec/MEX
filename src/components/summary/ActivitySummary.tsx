import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import BackLink from '../learn/BackLink.tsx'
import { ACTIVITY_TYPE_KEYS } from '../learn/text.ts'
import Badge from '../ui/Badge.tsx'
import ButtonLink from '../ui/ButtonLink.tsx'
import RatingScale from '../ui/RatingScale.tsx'
import { canOpen, isPlaceholder } from '../../content/index.ts'
import type { Confidence } from '../../learner/types.ts'
import { withUsefulnessRating } from '../../learner/usefulness.ts'
import { useLearner } from '../../learner/useLearner.ts'
import type { ActivityPageProps } from '../../pages/activityPageProps.ts'

// The activity summary (MVP-14, Scope v2 screen S14), shown in place of an activity once the
// learner finishes it; the player has already recorded completion. It recaps the activity
// (`recap`, supplied by the player), asks the optional "Was this useful?" 1-5 question and
// offers the next activity in the unit (the saffron action) or the unit. The rating is saved
// on the first tap and changed in place on a later tap; it never blocks leaving.
export default function ActivitySummary({
  pathway,
  pack,
  unit,
  activity,
  recap,
  selfAssessment = false,
}: ActivityPageProps & { recap: ReactNode; selfAssessment?: boolean }) {
  const { t } = useTranslation()
  const { update } = useLearner()
  const [rating, setRating] = useState<{ value: Confidence; ratedAt: string } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const unitPath = `/learn/${pathway}/${unit.id}`
  const position = unit.activities.findIndex((item) => item.id === activity.id)
  const next = unit.activities.slice(position + 1).find(canOpen)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  function rate(value: Confidence) {
    const ratedAt = rating?.ratedAt ?? new Date().toISOString()
    setRating({ value, ratedAt })
    update((current) => withUsefulnessRating(current, { activityId: activity.id, rating: value, ratedAt }))
  }

  return (
    <div className="flex flex-col gap-5" data-summary="true">
      <BackLink to={unitPath} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {isPlaceholder(pack.content_status) ? <Badge variant="sky">{t('home.sampleContent')}</Badge> : null}
          {selfAssessment ? <Badge variant="accent-tint">{t('home.readiness.label')}</Badge> : null}
          <Badge variant="success">{t('learn.done')}</Badge>
        </div>
        <h1 lang="en" className="text-h1">
          {activity.title}
        </h1>
        <p className="text-small text-ink-secondary">
          {t(`learn.types.${ACTIVITY_TYPE_KEYS[activity.type]}`)} · {t('learn.minutes', { n: activity.estimatedMinutes })}
        </p>
      </div>

      <section aria-labelledby="summary-heading" className="flex flex-col gap-3 rounded-card bg-success-tint p-5">
        <h2 id="summary-heading" ref={heading} tabIndex={-1} className="text-h2 text-success-text outline-none">
          {t('summary.completed')}
        </h2>
        <div className="flex flex-col gap-2 text-body">{recap}</div>
      </section>

      <section className="flex flex-col gap-3" data-rating="true">
        <RatingScale
          name={`${activity.id}-useful`}
          legend={t('summary.useful')}
          lowLabel={t('summary.notUseful')}
          highLabel={t('summary.veryUseful')}
          value={rating?.value ?? null}
          onChange={rate}
        />
        <p role="status" className="text-small text-ink-secondary">
          {rating ? t('summary.thanks') : null}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        {next ? (
          <>
            <ButtonLink to={`/learn/${pathway}/${unit.id}/${next.id}`} variant="accent" size="lg">
              {t('summary.next')}
            </ButtonLink>
            <ButtonLink to={unitPath} variant="secondary" size="lg">
              {t('summary.backToUnit')}
            </ButtonLink>
          </>
        ) : (
          <ButtonLink to={unitPath} variant="accent" size="lg">
            {t('summary.backToUnit')}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
