import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { LocalizedText } from '../../content/index.ts'
import { CheckIcon, CrossIcon } from '../icons/NavIcons.tsx'
import NativeText from '../lesson/NativeText.tsx'

// The panel shown after Check (MVP-10): an icon and a word for right or wrong, never colour
// alone; the right answer when the learner was wrong (matching shows it per pair instead);
// and the item's explanation in English, with the native version while the toggle is on.
const Feedback = forwardRef<
  HTMLDivElement,
  { correct: boolean; answer: string | null; explanation: LocalizedText; native: 'uz' | 'ru' | null }
>(function Feedback({ correct, answer, explanation, native }, ref) {
  const { t } = useTranslation()
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      data-feedback={correct ? 'correct' : 'incorrect'}
      className={[
        'flex flex-col gap-2 rounded-card px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
        correct ? 'bg-success-tint' : 'bg-error-tint',
      ].join(' ')}
    >
      <p className={['flex items-center gap-2 text-h3', correct ? 'text-success-text' : 'text-error-text'].join(' ')}>
        {correct ? <CheckIcon className="shrink-0" /> : <CrossIcon className="shrink-0" />}
        {correct ? t('exercise.correct') : t('exercise.incorrect')}
      </p>
      {!correct && answer ? <p className="text-body font-bold">{t('exercise.answerIs', { answer })}</p> : null}
      <p lang="en" className="text-body">
        {explanation.en}
      </p>
      <NativeText text={explanation} language={native} />
    </div>
  )
})

export default Feedback
