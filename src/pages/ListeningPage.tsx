import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QuestionPlayer from '../components/questions/QuestionPlayer.tsx'
import TextCard from '../components/questions/TextCard.tsx'
import Button from '../components/ui/Button.tsx'
import type { ListeningItem, Skill } from '../content/types.ts'
import { comprehensionItems } from '../learner/exercise.ts'
import { browserSpeech, isStopError, NORMAL_RATE, SLOW_RATE } from '../learner/speech.ts'
import { useOnDeviceVoice } from '../learner/useOnDeviceVoice.ts'
import type { ActivityPageProps } from './activityPageProps.ts'

// Listening player (MVP-11, Scope v2 screen S11, decision Q5). The transcript is spoken by
// an on-device English voice: Listen, Listen slowly (0.8 speed), and Stop while speaking.
// "Show the text" reveals the transcript at any time. When the device has no on-device
// English voice, or speaking fails, the transcript is shown with an honest note instead of
// the player, and answers are saved as reading rather than listening, since the learner read.

function asReading(skills: Skill[]): Skill[] {
  return [...new Set(skills.map((skill) => (skill === 'listening' ? 'reading' : skill)))]
}

export default function ListeningPage(props: ActivityPageProps) {
  const { t } = useTranslation()
  const [engine] = useState(browserSpeech)
  const voiceState = useOnDeviceVoice(engine)
  const [speaking, setSpeaking] = useState<'normal' | 'slow' | null>(null)
  const [failed, setFailed] = useState(false)
  const [showText, setShowText] = useState(false)
  const textId = useId()
  const listenings = props.activity.items.filter((item): item is ListeningItem => item.kind === 'listening')
  const textOnly = voiceState.status === 'none' || failed

  // Stop speaking when the learner leaves the screen.
  useEffect(() => () => engine?.cancel(), [engine])

  function listen(speed: 'normal' | 'slow') {
    if (!engine || voiceState.status !== 'ready') return
    setSpeaking(speed)
    engine.speak(listenings.map((item) => item.transcript).join('\n'), {
      voice: voiceState.voice,
      rate: speed === 'slow' ? SLOW_RATE : NORMAL_RATE,
      onEnd: () => setSpeaking(null),
      onError: (error) => {
        setSpeaking(null)
        if (!isStopError(error)) {
          engine.cancel()
          setFailed(true)
        }
      },
    })
  }

  function stop() {
    engine?.cancel()
    setSpeaking(null)
  }

  const texts = listenings.map((item) => <TextCard key={item.id} title={item.title} text={item.transcript} />)

  let intro
  if (textOnly) {
    intro = (
      <div className="flex flex-col gap-3" data-listening="text-only">
        <p role="status" className="rounded-panel bg-info-tint px-4 py-3 text-body text-info-text">
          {t('listening.noVoice')}
        </p>
        {texts}
      </div>
    )
  } else if (voiceState.status === 'checking') {
    intro = <div aria-busy="true" data-listening="checking" className="min-h-14" />
  } else {
    intro = (
      <div className="flex flex-col gap-3" data-listening="player">
        <div className="flex flex-wrap gap-3">
          {speaking ? (
            <Button variant="primary" size="md" onClick={stop}>
              {t('listening.stop')}
            </Button>
          ) : (
            <>
              <Button variant="primary" size="md" onClick={() => listen('normal')}>
                {t('listening.listen')}
              </Button>
              <Button variant="secondary" size="md" onClick={() => listen('slow')}>
                {t('listening.listenSlowly')}
              </Button>
            </>
          )}
        </div>
        <div>
          <Button variant="tertiary" size="sm" aria-expanded={showText} aria-controls={textId} onClick={() => setShowText(!showText)}>
            {showText ? t('listening.hideText') : t('listening.showText')}
          </Button>
        </div>
        <div id={textId} hidden={!showText}>
          {showText ? texts : null}
        </div>
      </div>
    )
  }

  return (
    <QuestionPlayer
      {...props}
      items={listenings.flatMap(comprehensionItems)}
      finishLabel={t('listening.finish')}
      intro={intro}
      skillsFor={(item) => (textOnly ? asReading(item.skills) : item.skills)}
    />
  )
}
