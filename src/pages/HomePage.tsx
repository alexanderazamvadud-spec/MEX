import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CurrentPathway from '../components/home/CurrentPathway.tsx'
import CurrentReadiness from '../components/home/CurrentReadiness.tsx'
import NextEvent from '../components/home/NextEvent.tsx'
import TodaysMission from '../components/home/TodaysMission.tsx'
import { loadPack, type ContentPack, type PathwayId } from '../content/index.ts'
import { currentUnit, fixedRuleProvider, type RecommendationProvider } from '../learner/home.ts'
import { useLearner } from '../learner/useLearner.ts'

// Home dashboard (MVP-07, Scope v2 screen S4): Today's Mission, Current Readiness,
// Current Pathway and Next Event, in that order. Every block shows the learner's real
// state from this device, which is mostly empty until activities can be completed;
// nothing is invented. Home writes only one thing: the active pathway, when switched.
export default function HomePage({ provider = fixedRuleProvider }: { provider?: RecommendationProvider }) {
  const { t } = useTranslation()
  const { record, update } = useLearner()
  const pathway = record.profile?.pathway ?? null
  const [loaded, setLoaded] = useState<{ pathway: PathwayId; pack: ContentPack } | null>(null)

  useEffect(() => {
    if (!pathway) return
    let active = true
    loadPack(pathway)
      .then((pack) => {
        if (active) setLoaded({ pathway, pack })
      })
      .catch((error: unknown) => {
        console.error('MEX could not load the content for the Home screen.', error)
      })
    return () => {
      active = false
    }
  }, [pathway])

  // RequireProfile guarantees a profile; this only guards against a reset while open.
  if (!pathway) return null

  const pack = loaded?.pathway === pathway ? loaded.pack : null
  const input = pack ? { pack, completions: record.completions } : null
  const plan = input ? provider(input) : { mission: [], nextEvent: null }
  const progress = input ? currentUnit(input) : null

  function switchTo(to: PathwayId) {
    const now = new Date().toISOString()
    update((current) =>
      current.profile ? { ...current, profile: { ...current.profile, pathway: to, updatedAt: now } } : current,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.home')}</h1>
      <TodaysMission pack={pack} mission={plan.mission} />
      <CurrentReadiness pathway={pathway} />
      <CurrentPathway pathway={pathway} pack={pack} progress={progress} onSwitch={switchTo} />
      <NextEvent pack={pack} nextEvent={plan.nextEvent} />
    </div>
  )
}
