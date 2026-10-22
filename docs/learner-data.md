# MEX learner data (Phase 1)

How learner progress is stored during the pilot. Owner decisions: local-only storage, no accounts, no server, no analytics, no personal data (Q1, Q2, 2026-10-09).

## Where

Everything lives in the learner's browser, in `localStorage`, under two keys:

| Key | Content |
|---|---|
| `mex.learner` | One JSON document: the learner record below |
| `mex.language` | The chosen interface language code |

Nothing is sent anywhere. Clearing the browser, using a private window or switching devices loses the data; the pilot briefing must say so. If storage is blocked, or a write fails because it is full, the app keeps working in memory for the session and `persistent` becomes false. This includes browsers that block site data, where even reading `window.localStorage` throws (fixed in MVP-17). The last onboarding step and Settings then show the owner-approved notice `onboarding.storageNotice`.

Storage is shared by every tab of the same browser. The store listens for changes made in other tabs and re-reads the record, so "Delete my data" in one tab also clears what the other tabs show, and the language choice follows too. Two tabs writing at the same moment still save the whole document last-write-wins; the pilot briefing should ask learners to use MEX in one tab.

## The record

`LearnerRecord` in `src/learner/types.ts`, schema version 1:

| Field | Meaning | Layer (Scope v2, Section 3) |
|---|---|---|
| `profile` | Interface language, self-reported level (plain words), goals, chosen pathway, timestamps; `null` until onboarding | Profile |
| `preferences.nativeExplanations` | Toggle for Uzbek/Russian explanations; `null` means "default for the level" (on for Beginner) | Preference |
| `completions` | Finished activities with content ids and time | Curriculum completion |
| `exerciseResults` | Auto-checked answers with item id, skills and correct/incorrect | Demonstrated skills |
| `selfAssessments` | Speaking, interview and writing practice (writing since MVP-16b): typed answer, self-check ticks, confidence 1 to 5 | Self-assessed readiness |
| `usefulnessRatings` | "Was this useful?" 1 to 5 per activity | Pilot feedback |
| `practiceSessions` | Finished interview practice runs: id, pathway, activity, finish time (MVP-15) | Readiness evidence |

Rules: records are appended, never rewritten, so history is kept even when later results are weaker; readiness and skill figures are computed from these raw facts on the device (MVP-15) and never stored; MEX never collects identifying fields (name, email, phone number, device identifier). Typed practice answers (`answerText`) are free text and may contain whatever the learner writes, including their name; they stay on the device and are removed by "Delete my data". Any future feature that sends answers off the device needs its own privacy decision by the owner.

## Access

Screens never touch `localStorage` directly. `LearnerProvider` (wrapping the app) supplies a `LearnerStore`; `useLearner()` returns `{ record, update, reset, persistent }`. `update` takes a function from the current record to a new one and persists the result; `reset` deletes both keys.

Adding accounts later means implementing the same `LearnerStore` interface against a server and passing it to `LearnerProvider`; screens stay unchanged. `migrateRecord` upgrades older stored shapes when the schema version changes.

## Onboarding (MVP-06b)

`#/onboarding` asks four questions in order: interface language, self-reported level (plain words, labelled "Your own estimate. This is not a test."), goals (one or more), and first pathway (one; owner decision Q8: one active pathway at a time). The profile is written once, when the learner presses "Start learning", by `withOnboardingProfile` in `src/learner/profile.ts`; it replaces only `profile`, keeps every other part of the record, and keeps the first `createdAt` when a returning learner finishes again. Leaving early writes nothing, except the interface language, which is stored as soon as it is chosen. No pathway is preselected or recommended from the goals.

Home, Learn and Progress need a profile: `RequireProfile` (`src/app/RequireProfile.tsx`) sends learners without one to `#/onboarding`. The landing page and Settings stay open to everyone, so "Delete my data" is always reachable.

When storage is unavailable (`persistent` is false), the last onboarding step shows the owner-approved notice `onboarding.storageNotice`.

## Home (MVP-07)

`#/home` reads the record and the active pathway's content pack and shows only the learner's real state; no figure is invented. The rules are pure functions in `src/learner/home.ts`:

- **Current unit:** the first unit with an activity not yet completed (the last unit once everything is done). The Current Pathway block shows "n of N activities completed" for that unit, from `completions` of the active pathway only (curriculum layer).
- **Today's Mission** (`fixedRuleProvider`, behind the `RecommendationProvider` type): the owner's fixed rules in `src/learner/mission.ts` (MVP-16, below).
- **Next Event:** the next activity not yet completed and not in the mission, in this unit or a later one; otherwise "Nothing planned yet".
- **Current Readiness:** Career Readiness only, labelled "Self-assessment". Since MVP-15 it shows the readiness level (see below), the number of finished sessions, "Highest reached" when it is higher than the current level, and a link to Progress. General English learners see an explanation that their progress does not count towards readiness, and no level.

Home writes one thing: "Switch pathway", after an in-page confirmation, changes `profile.pathway` and `profile.updatedAt`. Progress is stored per pathway, so nothing else changes.

## Learn screens (MVP-08)

The pathway and unit overviews read only `completions`, through `src/learner/progress.ts`: a unit is Not started, In progress or Completed from the activities completed in that pathway, and shows "n of N activities completed". The unit overview marks the activities in Today's Mission only for the active pathway. Browsing another pathway never changes `profile.pathway`; these screens write nothing.

## Lesson viewer (MVP-09)

The lesson screen writes two things through `src/learner/lesson.ts`:

- **`preferences.nativeExplanations`:** set when the learner uses the explanation switch. While it is `null`, `explanationsOn` uses the level default (on for Beginner, decision Q3). The choice applies to every lesson.
- **`completions`:** "Finish lesson" adds one `ActivityCompletion` (pathway, unit, activity, date) through `withCompletion`; finishing again keeps the first record. This is the curriculum layer only: lessons add nothing to exercise results, self-assessments or readiness.

## Exercise player (MVP-10)

The exercise screen writes three things through `src/learner/exercise.ts` and `src/learner/lesson.ts`:

- **`exerciseResults`:** each Check adds one `ExerciseResult` (pathway, activity, item, the item's `skills`, `correct`, date) through `withExerciseResult`. This is the demonstrated-skills layer. There is one attempt per item; replaying an exercise adds new results and never changes or removes earlier ones (mastery history). Results are only saved here; the Progress screen (MVP-15) decides how they are shown.
- **`completions`:** opening the results screen (the activity summary since MVP-14) adds one completion through `withCompletion`, whatever the score. Leaving before it keeps the results already checked and does not complete the activity.
- **`preferences.nativeExplanations`:** the same switch and preference as the lesson viewer.

Exercise results never change readiness, and the results screen says so. Answers are checked in the browser against the pack, so the answer keys are public; this is acceptable only for placeholder exercises (see `docs/content-model.md`).

## Reading and listening (MVP-11)

Reading and listening save results and completion exactly as exercises do. Each comprehension question is saved as `<item id>-q<n>` with the item's skills. When the listening player cannot speak (no on-device English voice, or speech fails) the learner answers from the text, so those results are saved with `reading` in place of `listening`. Speech uses only voices the browser marks as on-device, so the transcript is not sent anywhere; MEX relies on the browser's `localService` flag for this and cannot verify it.

## Speaking practice (MVP-12)

"Finish speaking" adds one `SelfAssessment` per item (`kind: "speaking"`, pathway, activity, item, the item's `skills`, one tick per self-check line, date) through `withSelfAssessment` in `src/learner/selfAssessment.ts`, then one completion. No box has to be ticked. Repeating the activity adds new entries and never changes earlier ones. No confidence rating is asked. Self-assessments are labelled as such and never change readiness on their own.

**Recordings are never saved (decision Q7).** The microphone is requested only when the learner taps Record (`src/learner/recording.ts`) and is released as soon as recording stops, or after 2 minutes. The clip is an in-memory Blob used only for playback on this screen. It is never written to browser storage, never added to the learner record and never uploaded. Record again, Finish, or leaving the screen discards it. If the microphone is refused or recording is not supported, the screen says so and the learner practises aloud.

## Interview practice (MVP-13)

"Next question" and "Finish interview practice" each add one `SelfAssessment` for the question on screen (`kind: "interview-question"`, pathway, activity, item, the item's `skills`, one tick per self-check line, date) through `withSelfAssessment`. A typed answer is saved as `answerText`, trimmed and at most 1,000 characters (`MAX_ANSWER_LENGTH`); a blank answer saves no `answerText`. A chosen confidence (1 to 5) is saved as `confidence`; none chosen saves none. Finish also adds one completion. Leaving half-way keeps the questions already saved and does not complete the activity; repeats add new entries. Recordings follow the MVP-12 rules and are never saved.

**Typed answers stay on this device.** They are personal text, kept only in this browser's storage for possible later feedback (Scope v2, Section 5.4), never sent anywhere, and removed by "Delete my data". Since MVP-15 each run has a session id (`sessionId` on every answer of the run), and Finish also adds one `practiceSessions` entry; a run left half-way has no entry and is not counted.

## Writing practice (MVP-16b)

"Finish writing practice" adds one `SelfAssessment` per writing task (`kind: "writing-task"`, pathway, activity, item, the item's `skills`, one tick per self-check line, date) through `withSelfAssessment`, then one completion. Typed text is optional: it is saved as `answerText`, trimmed and at most 2,000 characters (`MAX_WRITING_LENGTH`); a blank box saves no `answerText`. The text follows the same rules as interview answers: it stays in this browser's storage, is never sent anywhere and is removed by "Delete my data". Nothing is corrected or scored. Writing self-assessments do not count towards skills shown on Progress or towards readiness.

## Activity summary and "Was this useful?" (MVP-14)

Every activity ends on the summary. The summary itself writes only `usefulnessRatings`, through `withUsefulnessRating` in `src/learner/usefulness.ts`: `{activityId, rating 1–5, ratedAt}`. The rating is optional and saved on the first tap; a later tap on the same summary changes that entry (same `ratedAt`), and a later visit adds a new one. Ratings are feedback about the content, kept on this device only, removed by "Delete my data", and not used by Today's Mission, progress or readiness.

## Today's Mission rules (MVP-16)

Owner decision 2026-10-19; `MISSION_PILOT_SETTINGS` are pilot settings to be reviewed after the pilot. `planMission` reads `completions`, `exerciseResults`, `practiceSessions` and the time, and stores nothing. Each item carries the rule that chose it, and "Why this mission?" shows one sentence per item. No AI and no hidden values.

1. **Default:** the next unfinished activities of the current unit. The first is always included; the second only if the total stays at or below 20 minutes. Home shows the total.
2. **Next unit:** when a unit is finished and nothing in the next unit is completed yet, the mission is the next unit's first activity only.
3. **Everything finished:** the scored activity (exercises, reading, listening) with the lowest score, using the latest answer per question; on a tie, the earlier activity in the pathway.
4. **Interview (Career Readiness only):** once the learner has finished at least one interview session, and none in the last 7 × 24 hours by the device clock, the interview practice activity of the current unit (or the nearest earlier unit) takes the second slot, even beyond 20 minutes.

## Progress and readiness (MVP-15)

`#/progress` shows the three layers of Scope v2 Section 3 as separate sections, never added into one number:

- **Curriculum completion:** per pathway, activities and units completed (`completions`, `unitCompletion`).
- **Demonstrated skills:** `demonstratedSkills` in `src/learner/skills.ts`, from `exerciseResults` only, across both pathways: for vocabulary, grammar, reading and listening, "n of N questions right", where the latest answer to each question counts. Speaking and writing never appear here.
- **Readiness:** `readiness` in `src/learner/readiness.ts`, labelled "Self-assessment", Career Readiness only.

**Readiness rules (owner decision 2026-10-18, PILOT SETTINGS to be reviewed after the pilot; `READINESS_PILOT_SETTINGS`):** only finished Career Readiness interview practice sessions count. Getting started: fewer than 2 sessions. Building: at least 2. Confident: at least 4, and in the 3 most recent sessions an average confidence of at least 4 of 5 (rated questions only; none rated means not Confident) and at least 75% of all self-check boxes ticked. The level is recalculated each time and can go down. "Highest reached" replays the sessions in order and keeps the best level and the date it was first reached; it is never erased except by "Delete my data". General English data, unfinished runs and answers saved before MVP-15 (no session id) are never counted. Speaking practice in Career Readiness is shown as "n done" (distinct finished runs) as supporting evidence and does not change the level during the pilot. The rules ship in the public site bundle; the owner accepted this for the pilot.

## Settings (MVP-17)

`#/settings` writes only values that already exist:

- **Interface language:** the language buttons store `mex.language` at once. The profile's saved onboarding language is not changed.
- **Current pathway** (shown only when there is a profile): "Switch to …", after the same in-card confirmation as Home, changes `profile.pathway` and `profile.updatedAt` (`withPathway` in `src/learner/profile.ts`, used by Home too).
- **Explanations:** the switch writes `preferences.nativeExplanations`, the same preference the lesson and exercise screens use. In an English interface it is hidden and a line says explanations need the Uzbek or Russian interface.
- **About:** the version comes from `package.json`; the commit and build date are added at build time (`__MEX_BUILD__` in `vite.config.ts`, read through `src/buildInfo.ts`). Nothing is stored.

When a content pack cannot load (for example the connection dropped after the app opened), Home, the Learn screens, activities and Progress show "MEX could not load the lessons…" with "Try again", which reloads the page. Saved data is not touched. If the device is offline on the very first visit, the app itself cannot load, so no MEX message can appear.

## Deleting data

Settings offers "Delete my data": a confirmation step, then the record and language choice are removed and the interface returns to English. Texts live in the locale files under `settings.*`.

## Tests

`npm test` runs the unit tests in `src/learner/localStore.test.ts` `src/learner/profile.test.ts` `src/learner/home.test.ts`, `src/learner/progress.test.ts`, `src/learner/lesson.test.ts`, `src/learner/exercise.test.ts`, `src/learner/speech.test.ts`, `src/learner/selfAssessment.test.ts`, `src/learner/recording.test.ts`, `src/learner/usefulness.test.ts`, `src/learner/readiness.test.ts`, `src/learner/skills.test.ts` and `src/learner/mission.test.ts` (empty start, persistence, notifications and unsubscribe, reset, corrupt data, unavailable or blocked storage, failed writes, changes from other tabs, migration, every readiness threshold boundary). The deployment workflow runs them before the build.
