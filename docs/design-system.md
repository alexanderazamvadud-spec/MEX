# MEX design system

Reference for every task that touches the interface. The tokens live in `src/styles/theme.css`; the components in `src/components/ui`. Run `npm run check:contrast` after any colour change.

**Status.** Brand "Bright Start" (blue #1F57C3, Manrope) is CONFIRMED by the owner (2026-10-08). The visual style below comes from the owner's app mockup (`MEX App Mockup.html`) and is CONFIRMED for DESIGN-02 (2026-11-06): it replaces the Bright Start details of 24 px borderless tinted cards on a white page, pill buttons and saffron accents. Values the mockup does not define (hover tints, `outline`, `surface-muted` uses) were derived by the coding agent.

**The mockup is a future-phase reference, not Phase 1 scope.** Only its visual language is used. Its screens and features (speaking scores, AI-suggested words, accounts and public profiles, certificate details, numeric readiness gates, the job-sector start, "Today's plan" and its navigation) stay out of Phase 1; the confirmed product decisions are unchanged.

## Colours

| Token | Value | Use |
|---|---|---|
| `primary` | #1F57C3 | The main action, links, progress fill, selected borders |
| `primary-hover` | #163F8F | Hovered primary actions and links; text on selected chips and the language pill |
| `canvas` | #F5F7FB | Page background |
| `surface` | #FFFFFF | Cards, panels, secondary buttons, text fields |
| `surface-soft` / `surface-soft-hover` | #FFFFFF / #EEF0F5 | Default (white) cards; hovered white cards and secondary buttons |
| `surface-muted` | #EEF0F5 | Disabled buttons, neutral badges |
| `surface-sky` / `surface-sky-hover` | #E6EEFB / #DCE6F9 | Sky cards and panels, selected choices and chips; their hover |
| `accent-tint` / `accent-tint-hover` | #FFF1E0 / #FFE4C2 | Orange alert tint: alert cards and the "Self-assessment" badge on activities |
| `ink` | #0F1B33 | Text |
| `ink-secondary` / `ink-muted` | #4A5670 | Secondary and muted text, secondary-button labels, inactive navigation |
| `on-primary` / `on-primary-muted` | #FFFFFF / #D6E2FA | Text on primary surfaces; the white-outline button's border |
| `on-accent-tint` | #6B3600 | Text on the orange tint |
| `divider` | #DCE3F0 | Thin borders of cards that are controls (choices, options, secondary buttons), the bottom-navigation line |
| `outline` | #76829B | Borders of text fields, radio and tick indicators, rating chips (passes 3:1) |
| `dash-line` | #A9B4C8 | The dashed border of the ordering answer line (decorative; the line is also named "Your answer") |
| `track` / `track-on-primary` | #DCE3F0 / #163F8F | Progress-bar tracks on light and primary surfaces |
| `success-tint` / `success-border` / `success-text` | #E3F3EA / #1E7B4F / #1E5E3E | Success panels and right answers |
| `error-tint` / `error-border` / `error-text` | #FDE8E4 / #B8442C / #A3261B | Error panels and wrong answers; destructive-button label |
| `error-tint-hover` | #F9D5CE | Hovered error-tint controls |
| `warning-tint` / `warning-text` | #FFF1E0 / #6B3600 | Warning panels (orange tint pair) |
| `info-tint` / `info-text` | #E6EEFB / #1F57C3 | Info panels (sky tint pair) |

Rules:

- No saffron. One blue (`primary`) action per screen marks its main step; inside a blue surface the main action is white with blue text (`inverse`).
- Progress bars are 8 px with 4 px corners: blue on `track` on light surfaces, white on `track-on-primary` on primary cards.
- Feedback colours are always paired with an icon or wording, never colour alone.
- Every text pair passes WCAG 2.2 AA (4.5:1); every ring, indicator and bar passes 3:1. The script checks them (60 pairs). The thin `divider` borders are decorative: each control they frame is also identified by its text and, for choices, by an `outline` indicator.
- Deliberate difference from the mockup: text fields and radio, tick and rating indicators keep the darker `outline` (the mockup uses #DCE3F0, which is below 3:1 on white).
- A later dark theme overrides the same role-named variables under `[data-theme="dark"]`; components do not change.
- Tailwind's default palette is removed, so only these tokens exist as colour utilities.

## Typography

Manrope Variable, self-hosted, with a three-glyph companion family ("MEX Apostrophes", subset from Noto Sans) placed first in the font stack and limited by unicode-range to U+02BB, U+02BC and U+0301. Every other character falls through to Manrope.

- The Uzbek apostrophes oʻ, gʻ (U+02BB) and ʼ (U+02BC) render from the companion file in every browser.
- The Russian stress mark (U+0301) is included but only used by browsers that choose fonts per character (Firefox). Chromium and WebKit choose per letter-plus-mark cluster, and no family here has both a Cyrillic letter and the mark, so a stressed letter falls back as a whole to the device font. Known limitation, accepted by the owner for Phase 1 (2026-10-09).

| Utility | Size / line-height / weight |
|---|---|
| `text-wordmark` | 46 px / 1 / 800, tracking -0.03em |
| `text-display` | 28 px / 1.15 / 800 |
| `text-h1` | 26 px / 1.2 / 800 |
| `text-h2` | 22 px / 1.2 / 800 |
| `text-h3` | 18 px / 1.25 / 800 |
| `text-lead` | 17 px / 1.4 / 600 |
| `text-body` | 16 px / 1.5 / 600 (default) |
| `text-small` | 14 px / 1.45 / 600 |
| `text-label` | 13 px / 1.3 / 700, tracking 0.08em, used uppercase |

Rules: 12 px is the floor (owner decision); since DESIGN-02 the app's own text is at least 13 px. No all-caps and no italics for Uzbek or Russian running text (labels are the only uppercase). Uzbek oʻ and gʻ are written with U+02BB, never with a quotation mark. Use the named sizes above; Tailwind's generic sizes (`text-sm`, `text-base`...) stay available but are not part of the scale.

## Shape and layout

- Cards `rounded-card` (16 px); panels, choices and options `rounded-panel` (12 px); buttons `rounded-button` (14 px); small chips such as the 1 to 5 scale `rounded-chip` (10 px). Badges, the language pill, switches and indicators stay round (`rounded-pill`).
- Cards are white on the grey canvas, with no border and no shadow. Choices and options have a 1 px `divider` border; a chosen one gets a 2 px `primary` border on `surface-sky` (right and wrong answers: a 2 px success or error border on their tint).
- Interactive controls are at least 44 px tall. Button sizes: lg 58 px (18 px label), md 54 px (16 px), sm 44 px (14 px). Choices and options at least 54 px.
- Each screen has one dominant main action: the blue lg button, full width in the page column, at the end of the screen's flow. Other buttons are secondary (white with a thin border) or tertiary (text). Step controls inside an activity (Listen, Record, Stop) may be blue md buttons; they are smaller than the main action.
- Page column: `PageContainer`, 20 px side padding (`px-gutter`), centred and capped at 560 px (`max-w-page`).
- Focus: 2 px ring with 2 px offset, blue on light surfaces, white inside primary cards, never removed.
- Motion: 150 ms colour transitions only, disabled under `prefers-reduced-motion`.

## Components

- `Button`: variants primary (the main action), inverse (main action on blue: white, blue text), outline-inverse (quieter button on blue: white outline and text), secondary (white, thin border, grey label), selected (the chosen button in a toggle group: sky with a 2 px blue border), tertiary (text only), destructive (white, thin border, red label); sizes lg, md, sm; `fullWidth`, `loading` (keeps the label, shows a spinner, disables the control), `disabled`.
- `Card`: variants soft (white), sky, primary, accent-tint (orange alert); `CardButton` for a whole tappable card. `CardButton` renders a native button, so its children must be phrasing content (`span`, not `p`, `div` or headings).
- `Badge`: small pill label, 13 px; variants neutral (grey), accent-tint (orange), primary, sky, surface (white), success, error.
- `Wordmark`: "MEX" in primary blue; sizes lg and md.
- `PageContainer`: page column.
- `ButtonLink`: a react-router `Link` styled like `Button` (variants primary, inverse, secondary; sizes lg, md, sm). Use it when the control moves to another screen.

Inputs and progress bars are added by the tasks that need them, using these tokens.

## App shell and navigation (MVP-03)

- `AppShell` (layout route): `TopBar`, the screen inside `PageContainer`, then `BottomNav`. Screens: `#/home`, `#/learn`, `#/progress`, `#/settings`; any other hash path renders `NotFoundPage` inside the shell. `#/` is the public landing page and `#/onboarding` the onboarding screen (both outside the shell, see below). Home is the dashboard, Learn holds the pathway screens, Progress shows the three layers and Settings the learner's choices (see below). Home, Learn and Progress require a learner profile and send learners without one to onboarding.
- `TopBar`: the wordmark (links to Home, 44 px link box) and `LanguageMenu`, a 44 px pill showing the current language code, named "Interface language: UZ, Oʻzbekcha" (code plus name, so the visible code is part of the spoken name), that opens a panel with `LanguageButtons`. The panel closes after a choice, on Escape, or on a click outside; focus returns to the pill.
- `LanguageButtons`: three buttons in a group named "Interface language"; the active one uses the `selected` style (sky with a 2 px blue border), carries a checkmark and `aria-pressed="true"`, so the choice is never shown by colour alone.
- `BottomNav`: four tabs with outline icons from `src/components/icons/NavIcons.tsx` and translated 13 px labels in a 74 px bar; 66 px targets; the active tab is primary blue and extra bold with `aria-current="page"`; a 1 px divider on top. It stays at the bottom of the page column on every width in Phase 1.
- Icons are inline SVG on a 24 px grid, 2.2 px stroke, decorative (`aria-hidden`), always paired with a text label. No icon library.

Keep the real learning content out of the repository: `content-private/` is ignored by git for local drafts.

## Landing page (MVP-06)

- `#/` renders `LandingPage` without the app shell: its own header (wordmark, `LanguageMenu`, "Open the demo" link), then hero, two pathways, how MEX works, who MEX serves, prototype and privacy, and a footer.
- The page column is wider than the app's: `max-w-landing` (1040 px, `--container-landing`), with the same 20 px gutter. Cards sit side by side from the `md` breakpoint; on phones everything stacks.
- The hero is a primary-blue surface whose main action, "Explore the MEX Demo", is the white `inverse` button; "Discover the Pathways" is the white-outline button. Decoration is CSS only (circles in `primary-hover`); no images.
- Both pathway cards use the same variant, size and heading level, so neither appears secondary.
- "Discover the Pathways" scrolls to the pathways section and moves focus to its heading without touching the URL hash, which holds the route.
- The page reads and writes no learner data and never redirects; returning learners use the demo link.
- The prototype section lists "What works today" and "Planned" (MVP-16b): today lists both pathways, lessons, exercises, reading and listening, speaking practice, interview practice, writing practice, Today's Mission (chosen by simple, transparent rules), progress and readiness, three languages and Delete my data; planned lists AI coaching, AI-personalised learning recommendations, speaking assessment, learner accounts and certificates.

## Terms and privacy (MVP-18)

- `#/terms` renders `TermsPage` outside the app shell, like the landing page: wordmark and `LanguageMenu` in the header, the 560 px page column, no bottom navigation.
- Back link, the h1 "Terms and privacy", the copyright notice, then two h2 sections: "Terms of use" (numbered list) and "Privacy" (bulleted list). Each item starts with its title in bold. The last privacy item links to the owner's Telegram contact in a new tab, with an "opens in a new tab" note for screen readers.
- Linked from the landing footer and from Settings, About. Back returns to the screen the link was on (passed as router state), or to the landing page.
- The landing footer reads "© 2026 Alexis Team LLC. All rights reserved. MEX — Modern Employability eXperience." (the same in every language) followed by the translated "The lessons in this pilot are sample content for testing.", then the prototype note and the "Terms and privacy" link.

## Onboarding (MVP-06b)

- `#/onboarding` is outside the app shell: wordmark and the step counter ("Step {n} of 4") in the header with a decorative step bar (`MeterBar`) below it, no bottom navigation and no language pill (step 1 is the language). It uses the 560 px page column.
- One question per step as the screen's `h1`, with its hint below. Focus moves to the question after Next or Back. Next stays enabled; with nothing chosen it shows an error panel (`error-tint`, wording, `role="alert"`). Back and Next sit side by side from the `sm` breakpoint and stack on phones, Next on top.
- `ChoiceCard` (`src/components/onboarding/ChoiceCard.tsx`): a whole white card with a thin border that is one native radio button or checkbox, visually hidden but kept for keyboard use and screen readers. Selected cards turn `surface-sky` with a 2 px blue border and fill the round (radio) or square (checkbox) indicator with primary blue and a checkmark, so the choice is never shown by colour alone. At least 54 px tall; focus ring around the whole card.
- The storage notice is a `warning-tint` panel on the last step, shown only when saving is impossible.

## Home (MVP-07)

- `#/home` inside the app shell: the screen `h1` ("Home"), then four `HomeBlock` cards (`src/components/home/`), in this order: Today's Mission, Current Readiness, Current Pathway, Next Event. Today's Mission is the blue (primary) card, the screen's dominant block; the other three are white cards. Each has a level-2 heading and, where it applies, a badge ("Sample content" for placeholder content, "Self-assessment" on readiness): sky on white cards, white on the blue card.
- No blue button on Home and no Start button: the mission lists its activities as white link panels inside the blue card, and "Why this mission?" is a native `<details>` disclosure with a 44 px summary.
- "Switch pathway" is a tertiary button; it opens an in-card confirmation (grey `canvas` panel, primary "Switch" and secondary "Cancel"). Focus moves into the confirmation and back to the button when it closes.
- While the content pack loads, the pack-dependent blocks show their heading only, marked `aria-busy`.

## Learn screens (MVP-08)

- `#/learn` (pathways hub): both pathways as identical `sky` link cards in the landing-page order, with the approved names and descriptions; only the active one carries a white "Your current pathway" badge.
- `#/learn/:pathway` (pathway overview) and `#/learn/:pathway/:unit` (unit overview) start with a 44 px "Back" link to the parent screen. Unknown ids show the Not found screen inside the shell; the bottom navigation keeps Learn active.
- `LinkCard` (`src/components/learn/LinkCard.tsx`): a whole soft or sky card that is one link (unit rows, pathway cards), with the card focus ring.
- Unit rows show a status badge: Not started (neutral grey), In progress (sky), Completed (success).
- Activity rows show title, type and minutes, and badges for Completed (success), Today's mission (sky) and "Opens soon" (neutral grey). A row is a link only when its activity type has a player (`PLAYABLE_ACTIVITY_TYPES` in `src/content/index.ts`; lessons since MVP-09); until then it is plain and carries "Opens soon". Adding a type to that set removes the label and makes the row a link.
- Today's Mission on Home: each activity links to itself when it has a player, otherwise to its unit overview.

## Lesson viewer (MVP-09)

- `#/learn/:pathway/:unit/:activity` for lessons: Back link to the unit, badges ("Sample content", "Completed"), the activity title, type and minutes, then the instructions and one section per content kind in pack order: "Key phrases" (soft cards: phrase, Example, optional Note), "Grammar" (sky card: title, explanation, Examples list) and "Dialogue" (soft card: speaker in primary blue above each line). Teaching content carries `lang="en"`.
- `Switch` (`src/components/ui/Switch.tsx`): a native checkbox with `role="switch"` inside a 44 px label, named by its label and described by its hint. On: primary track, white thumb on the right; off: white track with outline, grey thumb on the left, so the state is not shown by colour alone.
- The explanation switch sits in a soft panel above the instructions and only appears with Uzbek or Russian as the interface language. Native-language text appears under the English with a `track`-coloured left border.
- "Finish lesson" is the screen's main action (primary lg, full width).

## Exercise player (MVP-10)

- Same header as the lesson viewer, then the explanation switch (UZ/RU only), the instructions, "Question n of N" (label style), the item prompt as an h2 (`lang="en"`) and a hint ("Choose an answer", "Fill the gap", "Choose a match", "Tap the parts in order").
- Multiple choice and gap-fill: `OptionCard`, a whole-card radio like the onboarding cards. After Check the right option turns `success-tint` with a filled check and a wrong choice `error-tint` with a filled cross. The gap-fill sentence shows its gap as a thick underline that the chosen option fills in primary blue.
- Matching: one soft card per left-hand text with a native 44 px `select`. After Check each card turns success or error tint and says "Correct" or "Not quite. The answer is: ..." with a check or cross icon.
- Ordering: an answer line (dashed `dash-line` border) holding the placed parts as blue 12 px chips, the unplaced parts as white chips with a thin border below, and "Start again" (tertiary, sm). No drag and drop.
- Feedback panel: `success-tint` or `error-tint` card with a check or cross and "Correct" or "Not quite" (h3), the right answer when wrong, then the explanation; it takes focus after Check. Right and wrong are never shown by colour alone.
- Check, Next and See results are primary lg buttons. Since MVP-14 the results screen is the activity summary (see below).
- New contrast pairs for these panels are in `scripts/check-contrast.mjs` (49 pairs at the time; 60 since DESIGN-02).
- The explanation switch on question screens uses the hint "Shows a translation of the instructions and explanations." (MVP-11). The ordering answer line is named "Your answer" for screen readers.

## Reading and listening (MVP-11)

- Reading: the text sits in a soft card (`TextCard`: h2 title, one paragraph per line) between the instructions and the question, on every question screen.
- Listening: "Listen" (primary md) and "Listen slowly" (secondary md); while speaking, a single "Stop" (primary md). "Show the text" / "Hide the text" (tertiary sm, `aria-expanded`) reveals the transcript in a `TextCard`.
- No on-device voice or a speech error: an info panel (`info-tint`, `role="status"`) with the honest note, followed by the transcript. No player buttons are shown.
- Reading and listening end on the activity summary, like exercises (MVP-14).

## Speaking practice (MVP-12)

- One screen with five sections (h2): The task, Prepare, Speak, Model answer, Check yourself. The header shows "Sample content" and a "Self-assessment" badge; the Check section starts with the line saying MEX does not listen to or score the learner's speaking.
- Timers show `m:ss` (`role="timer"`), with "Time's up" announced through `role="status"`. "Start preparing" (secondary md) turns into "I'm ready" (tertiary) while running; "Start speaking" (secondary md).
- Recording: the note "Your recording stays on this device…" above "Record" (primary md). While recording, a pulsing dot, "Recording m:ss" and "Stop" (primary md). Afterwards a native audio player and "Record again" (secondary md). Not available: an info panel (`info-tint`, `role="status"`).
- Model answer: "Show the model answer" (secondary md), then the English text and, with an on-device voice, "Listen to the model answer".
- Self-check: one `ChoiceCard` tick box per line (English title, native line as the description).
- "Finish speaking" is the main action (primary lg, full width), at the bottom.

## Interview practice (MVP-13)

- One question per screen. The question sits in a sky card: "Question n of 3" (small, secondary), the question as an h2 in English, and "Listen to the question" (secondary md) only with an on-device voice. The question takes focus when the learner moves to the next one.
- Sections (h3): Useful phrases (English list), Your answer (a text area with a 2 px outline border and the "saved only on this device" note, then the MVP-12 recorder in a sky card), Model answers ("Show the model answers", secondary md, then "Example 1" and "Example 2" cards), Check yourself (the self-note and `ChoiceCard` tick boxes).
- Confidence: a fieldset with the question as its legend and five chip radio buttons (1 to 5, at least 44 px high, 10 px corners), labelled "Not yet" under 1 and "Ready" under 5. The chosen one is sky with a 2 px blue border.
- "Next question" is primary lg; on the last question "Finish interview practice" is the main action (both full width).
- The header shows "Sample content" and the "Self-assessment" badge, as on speaking.

## Writing practice (MVP-16b)

- Same header as speaking: back link, "Sample content", "Self-assessment", the English title, the type and minutes line, and the native-language switch.
- The task sits in a sky panel in English (lead size), with the native explanation below when explanations are on.
- Sections (h2): Your email (a text area, 9 rows, 2,000 characters at most, with the note "Optional. What you write stays on this device."), Model email ("Show model email" / "Hide model email", secondary md with `aria-expanded`; the English model keeps its line breaks), Check your email (the note "Tick what your email does." and `ChoiceCard` tick boxes, English title and native description).
- "Finish writing practice" is the main action (primary lg, full width). Nothing is corrected; the summary shows "You ticked n of N checks…".

## Activity summary (MVP-14)

- Shown in place of the activity when it ends: after Finish (lesson, speaking, interview, writing) or after the last question (exercises, reading, listening). The same header as the activity, with the "Completed" badge (and "Self-assessment" on speaking, interview and writing).
- A success-tint card with the h2 "Activity completed" (success text, takes focus) and the recap: the practice score and note, the lesson line, or "You ticked n of N checks…".
- "Was this activity useful to you?": the shared `RatingScale` (five chip radio buttons, at least 44 px high, "Not useful" under 1 and "Very useful" under 5; also used for interview confidence). Optional; after a tap a small status line thanks the learner.
- "Next activity" (primary lg link) and "Back to unit" (secondary lg link), stacked at full width. On the unit's last activity only "Back to unit", as the main (primary) action.

## Today's Mission (MVP-16)

- The mission (the blue card) lists up to two activities as white link panels, then a small "About n minutes in total" line.
- "Why this mission?" (native `<details>`, 44 px summary) shows one sentence per item naming the rule that chose it, then "MEX chooses missions with fixed rules, the same for every learner. No AI is used."

## Progress (MVP-15)

- `#/progress`: the screen `h1` ("Progress"), a one-line intro, then three white cards in this order, each with a level-2 heading and a one-line description: "What you have finished", "What you got right", "How ready you feel" (with the `sky` "Self-assessment" badge, the only one on the screen).
- Completion and skill rows use a thin decorative bar (`MeterBar`: primary fill on the light track, `aria-hidden`); the text beside it always carries the figures. No percentages and no grades.
- Readiness shows "Current level" and the level name (h3 style, primary), the one-sentence explanation, "This is your own view, not a test result.", "Highest reached" with its date, and the evidence list. Averages are shown with one decimal, rounded down so a value below 4 never reads as "4.0".
- Read-only: no main (blue) action and no buttons. On Home, the readiness block adds a secondary sm link "See your progress"; Home still has no blue button.

## Settings (MVP-17)

- `#/settings`: the screen `h1`, then white cards (`p-5`, level-2 headings) in this order: "Interface language" (`LanguageButtons`), "Current pathway" (the name in h3 style and a tertiary "Switch to …" with the shared `PathwaySwitch` confirmation, as on Home), "Explanations" (the `Switch`, or in an English interface one line naming Oʻzbekcha and Русский, each with its own `lang`), "Delete my data" (privacy note and the destructive button), "About" (one line, then the version in small secondary text). No main (blue) action.
- When the device cannot save, the warning-tinted storage notice sits just above "Delete my data".

## Content-load message (MVP-17)

- `ContentLoadError`: a soft card with `role="alert"`, the message and a primary sm "Try again" (reloads the page). Home keeps its h1 and the readiness block below it; Progress shows it inside "What you have finished" and keeps the other two cards; the Learn screens and activities show the "Learn" h1 above it. Nothing stays marked as busy.

## Quality pass (MVP-17)

- After moving to another screen inside the app, focus goes to the new screen's `h1` (no focus ring on the heading, since it is not a control), and the tab title names the section ("Learn · MEX").
- Long words may break (`overflow-wrap: anywhere` on `body`), so nothing scrolls sideways at 200% zoom on a 390 px phone.
- Checked in Chromium on every screen at 360 × 740, 390 × 844, 412 × 915, 844 × 390, 320 × 640, 1280 × 800 and 1440 × 900 in EN, UZ and RU: no horizontal scroll, every target at least 44 px, at most one main action (saffron at the time; blue since DESIGN-02), one h1 and no skipped heading level, axe-core with no violations, reduced motion, and no external requests. Screen readers are checked on a real phone (owner checklist).

## Development style guide

`#/styleguide` shows every token and component. It exists only in development builds: the route and its code are excluded from production, although the utility classes it uses are still compiled into the production stylesheet (a few hundred bytes).

## Visual refresh (DESIGN-02)

- Owner request (2026-11-06): "make design exactly like this" for `MEX App Mockup.html`, ruled as option A: the mockup's visual language on every existing screen, with no feature or text changes, plus three learnability rules: larger body text and buttons (done above), one dominant main action per screen (done above), and the support-language translation under every English phrase.
- The translation rule is not built yet: the English teaching content has no Uzbek or Russian versions, and every new text needs the owner's approval in all three languages before use.
- Navigation stays Home, Learn, Progress, Settings.
