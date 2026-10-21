import { useTranslation } from 'react-i18next'
import CurrentPathway from '../components/home/CurrentPathway.tsx'
import CurrentReadiness from '../components/home/CurrentReadiness.tsx'
import NextEvent from '../components/home/NextEvent.tsx'
import TodaysMission from '../components/home/TodaysMission.tsx'
import type { PathwayId } from '../content/index.ts'
import ContentLoadError from '../components/ui/ContentLoadError.tsx'
import { usePackResult } from '../content/usePack.ts'
import { currentUnit, fixedRuleProvider, homeInput, type RecommendationProvider } from '../learner/home.ts'
import { withPathway } from '../learner/profile.ts'
import { useLearner } from '../learner/useLearner.ts'

// Home dashboard (MVP-07, Scope v2 screen S4): Today's Mission, Current Readiness,
// Current Pathway and Next Event, in that order. Every block shows the learner's real
// state from this device, which is mostly empty until activities can be completed;
// nothing is invented. Home writes only one thing: the active pathway, when switched.
export default function HomePage({ provider = fixedRuleProvider }: { provider?: RecommendationProvider }) {
  const { t } = useTranslation()
  const { record, update } = useLearner()
  const pathway = record.profile?.pathway ?? null
  const { pack, failed } = usePackResult(pathway)

  // RequireProfile guarantees a profile; this only guards against a reset while open.
  if (!pathway) return null

  const input = pack ? homeInput(pack, record) : null
  const plan = input ? provider(input) : { mission: [], nextEvent: null }
  const progress = input ? currentUnit(input) : null

  function switchTo(to: PathwayId) {
    const now = new Date().toISOString()
    update((current) => withPathway(current, to, now))
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">{t('nav.home')}</h1>
      {failed ? (
        <>
          <ContentLoadError />
          <CurrentReadiness pathway={pathway} />
        </>
      ) : (
        <>
          <TodaysMission pack={pack} mission={plan.mission} />
          <CurrentReadiness pathway={pathway} />
          <CurrentPathway pathway={pathway} pack={pack} progress={progress} onSwitch={switchTo} />
          <NextEvent pack={pack} nextEvent={plan.nextEvent} />
        </>
      )}
    </div>
  )
}
