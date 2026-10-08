import { Link } from 'react-router'
import LanguageMenu from './LanguageMenu.tsx'
import Wordmark from '../ui/Wordmark.tsx'

// Top bar of the app shell: wordmark on the left (links to Home), language pill on the right.
// The link box is at least 44 px tall; its accessible name is the visible "MEX".
export default function TopBar() {
  return (
    <header className="flex min-h-14 items-center justify-between gap-3 py-2">
      <Link
        to="/home"
        className="inline-flex min-h-11 items-center rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
      >
        <Wordmark size="md" />
      </Link>
      <LanguageMenu />
    </header>
  )
}
