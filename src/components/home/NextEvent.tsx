import { useTranslation } from 'react-i18next'
import type { Activity, ContentPack } from '../../content/index.ts'
import HomeBlock from './HomeBlock.tsx'

// Block 4: the next suggested practice as plain text. No date, time, reminder or notification.
export default function NextEvent({ pack, nextEvent }: { pack: ContentPack | null; nextEvent: Activity | null }) {
  const { t } = useTranslation()
  return (
    <HomeBlock title={t('home.next.title')} busy={!pack} data-block="next">
      {pack ? (
        <p className="text-body">
          {nextEvent ? t('home.next.line', { activity: nextEvent.title }) : t('home.next.none')}
        </p>
      ) : null}
    </HomeBlock>
  )
}
