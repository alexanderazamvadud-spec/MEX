# MEX design system ("Bright Start")

Reference for every task that touches the interface. The tokens live in `src/styles/theme.css`; the components in `src/components/ui`. Run `npm run check:contrast` after any colour change.

All values below are CONFIRMED by the owner (the hover tints, accent-hover and outline were derived by the coding agent and confirmed on 2026-10-09).

## Colours

| Token | Value | Use |
|---|---|---|
| `primary` | #1F57C3 | Primary actions, links, progress on light surfaces |
| `primary-hover` | #16418F | Hovered primary actions and links |
| `accent` | #F6BE2C | One highlighted action or badge per screen; always with ink text |
| `accent-hover` | #E0A410 | Hovered accent buttons |
| `surface` | #FFFFFF | Page background |
| `surface-soft` / `surface-soft-hover` | #F2F5FC / #E4EAF7 | Soft cards; hovered tappable soft cards |
| `surface-sky` / `surface-sky-hover` | #EAF0FC / #DCE6F9 | Sky cards, secondary buttons; hovered tappable sky cards |
| `accent-tint` / `accent-tint-hover` | #FFF4D6 / #FFE9B8 | Soft saffron cards and badges; hovered tappable accent-tint cards |
| `ink` | #121826 | Text, and the label on saffron (`on-accent`) |
| `ink-secondary` | #485066 | Secondary text |
| `ink-muted` | #5A6275 | Muted text, disabled labels, inactive navigation |
| `on-primary` / `on-primary-muted` | #FFFFFF / #D6E2FA | Text on primary surfaces |
| `on-accent` | #121826 | Text on saffron (never white) |
| `on-accent-tint` | #7A5A00 | Text on accent tint |
| `divider` | #E6EBF5 | Decorative lines only (bottom-navigation top line, popover edge) |
| `outline` | #76829B | Borders of interactive controls (passes 3:1) |
| `track` / `track-on-primary` | #D3DEF5 / #16418F | Progress-bar tracks on light and primary surfaces |
| `success-tint` / `success-border` / `success-text` | #E3F4E8 / #1E7B3A / #17602F | Success panels |
| `error-tint` / `error-border` / `error-text` | #FDE8E4 / #B8442C / #8A2A17 | Error panels, destructive buttons |
| `error-tint-hover` | #F9D5CE | Hovered destructive buttons |
| `warning-tint` / `warning-text` | #FFF4D6 / #7A5A00 | Warning panels (saffron tint pair) |
| `info-tint` / `info-text` | #EAF0FC / #1F57C3 | Info panels (sky tint pair) |

Rules:

- Saffron appears only as a fill under ink text or icons, as a pill badge, or as a fill on primary-blue surfaces. It is never a thin line, border, underline, focus ring or progress bar on a light surface (1.7:1 on white).
- Progress bars on light surfaces are blue on `track`; on primary cards they are saffron on `track-on-primary`.
- Feedback colours are always paired with an icon or wording, never colour alone.
- Every text pair passes WCAG 2.2 AA (4.5:1); every ring, border and bar passes 3:1. The script checks them.
- A later dark theme overrides the same role-named variables under `[data-theme="dark"]`; components do not change.
- Tailwind's default palette is removed, so only these tokens exist as colour utilities.

## Typography

Manrope Variable, self-hosted, with a three-glyph companion family ("MEX Apostrophes", subset from Noto Sans) placed first in the font stack and limited by unicode-range to U+02BB, U+02BC and U+0301. Every other character falls through to Manrope.

- The Uzbek apostrophes oʻ, gʻ (U+02BB) and ʼ (U+02BC) render from the companion file in every browser.
- The Russian stress mark (U+0301) is included but only used by browsers that choose fonts per character (Firefox). Chromium and WebKit choose per letter-plus-mark cluster, and no family here has both a Cyrillic letter and the mark, so a stressed letter falls back as a whole to the device font. Known limitation, accepted by the owner for Phase 1 (2026-10-09).

| Utility | Size / line-height / weight |
|---|---|
| `text-wordmark` | 46 px / 1 / 800, tracking -0.03em |
| `text-display` | 30 px / 1.15 / 800 |
| `text-h1` | 26 px / 1.2 / 800 |
| `text-h2` | 24 px / 1.2 / 800 |
| `text-h3` | 20 px / 1.25 / 800 |
| `text-lead` | 17 px / 1.4 / 600 |
| `text-body` | 15 px / 1.5 / 600 (default) |
| `text-small` | 13 px / 1.45 / 600 |
| `text-label` | 12 px / 1.3 / 700, tracking 0.08em, used uppercase |

Rules: 12 px is the floor (owner decision). No all-caps and no italics for Uzbek or Russian running text (labels are the only uppercase). Uzbek oʻ and gʻ are written with U+02BB, never with a quotation mark. Use the named sizes above; Tailwind's generic sizes (`text-sm`, `text-base`...) stay available but are not part of the scale.

## Shape and layout

- Buttons are pills (`rounded-pill`); cards use `rounded-card` (24 px) and feedback panels `rounded-panel` (20 px). No borders or shadows on cards.
- Interactive controls are at least 44 px tall. Button sizes: lg 56 px, md 52 px, sm 44 px.
- Page column: `PageContainer`, 18 px side padding (`px-gutter`), centred and capped at 560 px (`max-w-page`).
- Focus: 2 px ring with 2 px offset, blue on light surfaces, white inside primary cards, never removed.
- Motion: 150 ms colour transitions only, disabled under `prefers-reduced-motion`.

## Components

- `Button`: variants primary, accent, secondary, tertiary, destructive; sizes lg, md, sm; `fullWidth`, `loading` (keeps the label, shows a spinner, disables the control), `disabled`.
- `Card`: variants soft, sky, primary, accent-tint; `CardButton` for a whole tappable card. `CardButton` renders a native button, so its children must be phrasing content (`span`, not `p`, `div` or headings).
- `Badge`: small pill label; variants accent, accent-tint, primary, sky, surface, success, error.
- `Wordmark`: "MEX" in primary blue; sizes lg and md.
- `PageContainer`: page column.

Inputs and progress bars are added by the tasks that need them, using these tokens.

## App shell and navigation (MVP-03)

- `AppShell` (layout route): `TopBar`, the screen inside `PageContainer`, then `BottomNav`. Screens: `#/home`, `#/learn`, `#/progress`, `#/settings`; any other hash path renders `NotFoundPage` inside the shell. `#/` keeps the placeholder until the landing page exists.
- `TopBar`: the wordmark (links to Home, 44 px link box) and `LanguageMenu`, a 44 px pill showing the current language code, named "Interface language: UZ, Oʻzbekcha" (code plus name, so the visible code is part of the spoken name), that opens a panel with `LanguageButtons`. The panel closes after a choice, on Escape, or on a click outside; focus returns to the pill.
- `LanguageButtons`: three pill buttons in a group named "Interface language"; the active one is primary blue, carries a checkmark and `aria-pressed="true"`, so the choice is never shown by colour alone.
- `BottomNav`: four tabs with outline icons from `src/components/icons/NavIcons.tsx` and translated labels; 48 px targets; the active tab is primary blue with `aria-current="page"`; a 1 px divider on top. It stays at the bottom of the page column on every width in Phase 1.
- Icons are inline SVG on a 24 px grid, 2.2 px stroke, decorative (`aria-hidden`), always paired with a text label. No icon library.

Keep the real learning content out of the repository: `content-private/` is ignored by git for local drafts.

## Development style guide

`#/styleguide` shows every token and component. It exists only in development builds: the route and its code are excluded from production, although the utility classes it uses are still compiled into the production stylesheet (a few hundred bytes).
