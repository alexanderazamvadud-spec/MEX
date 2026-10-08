import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HomeIcon, LearnIcon, ProgressIcon, SettingsIcon } from '../icons/NavIcons.tsx'

const items = [
  { to: '/home', key: 'nav.home', Icon: HomeIcon },
  { to: '/learn', key: 'nav.learn', Icon: LearnIcon },
  { to: '/progress', key: 'nav.progress', Icon: ProgressIcon },
  { to: '/settings', key: 'nav.settings', Icon: SettingsIcon },
] as const

// Bottom navigation: four tabs, 48 px targets, active tab in primary blue and aria-current="page".
export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="sticky bottom-0 border-t border-divider bg-surface">
      <ul className="mx-auto flex w-full max-w-page justify-around px-gutter">
        {items.map(({ to, key, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-[12px] font-bold no-underline',
                  'rounded-panel focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--focus-ring)',
                  isActive ? 'text-primary' : 'text-ink-muted hover:text-ink',
                ].join(' ')
              }
            >
              <Icon />
              <span>{t(key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
