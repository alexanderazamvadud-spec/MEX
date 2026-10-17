# MEX learner data (Phase 1)

How learner progress is stored during the pilot. Owner decisions: local-only storage, no accounts, no server, no analytics, no personal data (Q1, Q2, 2026-10-09).

## Where

Everything lives in the learner's browser, in `localStorage`, under two keys:

| Key | Content |
|---|---|
| `mex.learner` | One JSON document: the learner record below |
| `mex.language` | The chosen interface language code |

Nothing is sent anywhere. Clearing the browser, using a private window or switching devices loses the data; the pilot briefing must say so. If storage is blocked, or a write fails because it is full, the app keeps working in memory for the session and `persistent` becomes false; no screen shows a notice about this yet (its wording needs the owner's approval).

Storage is shared by every tab of the same browser. The store listens for changes made in other tabs and re-reads the record, so "Delete my data" in one tab also clears what the other tabs show, and the language choice follows too. Two tabs writing at the same moment still save the whole document last-write-wins; the pilot briefing should ask learners to use MEX in one tab.

## The record

`LearnerRecord` in `src/learner/types.ts`, schema version 1:

| Field | Meaning | Layer (Scope v2, Section 3) |
|---|---|---|
| `profile` | Interface language, self-reported level (plain words), goals, chosen pathway, timestamps; `null` until onboarding | Profile |
| `preferences.nativeExplanations` | Toggle for Uzbek/Russian explanations; `null` means "default for the level" (on for Beginner) | Preference |
| `completions` | Finished activities with content ids and time | Curriculum completion |
| `exerciseResults` | Auto-checked answers with item id, skills and correct/incorrect | Demonstrated skills |
| `selfAssessments` | Speaking, interview and writing practice: typed answer, self-check ticks, confidence 1 to 5 | Self-assessed readiness |
| `usefulnessRatings` | "Was this useful?" 1 to 5 per activity | Pilot feedback |

Rules: records are appended, never rewritten, so history is kept even when later results are weaker; readiness and skill figures are computed by later tasks from these raw facts; MEX never collects identifying fields (name, email, phone number, device identifier). Typed practice answers (`answerText`) are free text and may contain whatever the learner writes, including their name; they stay on the device and are removed by "Delete my data". Any future feature that sends answers off the device needs its own privacy decision by the owner.

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
- **Today's Mission** (`fixedRuleProvider`, behind the `RecommendationProvider` type so MVP-16 can replace it): the next two activities not yet completed in the current unit, in content order.
- **Next Event:** the next activity not yet completed after the mission, in this unit or a later one; otherwise "Nothing planned yet".
- **Current Readiness:** Career Readiness only, labelled "Self-assessment". MVP-07 shows no figure; the rule for one is set when the self-assessment activities exist. General English learners see an explanation that their progress does not count towards readiness.

Home writes one thing: "Switch pathway", after an in-page confirmation, changes `profile.pathway` and `profile.updatedAt`. Progress is stored per pathway, so nothing else changes.

## Learn screens (MVP-08)

The pathway and unit overviews read only `completions`, through `src/learner/progress.ts`: a unit is Not started, In progress or Completed from the activities completed in that pathway, and shows "n of N activities completed". The unit overview marks the activities in Today's Mission only for the active pathway. Browsing another pathway never changes `profile.pathway`; these screens write nothing.

## Lesson viewer (MVP-09)

The lesson screen writes two things through `src/learner/lesson.ts`:

- **`preferences.nativeExplanations`:** set when the learner uses the explanation switch. While it is `null`, `explanationsOn` uses the level default (on for Beginner, decision Q3). The choice applies to every lesson.
- **`completions`:** "Finish lesson" adds one `ActivityCompletion` (pathway, unit, activity, date) through `withCompletion`; finishing again keeps the first record. This is the curriculum layer only: lessons add nothing to exercise results, self-assessments or readiness.

## Deleting data

Settings offers "Delete my data": a confirmation step, then the record and language choice are removed and the interface returns to English. Texts live in the locale files under `settings.*`.

## Tests

`npm test` runs the unit tests in `src/learner/localStore.test.ts` `src/learner/profile.test.ts` `src/learner/home.test.ts`, `src/learner/progress.test.ts` and `src/learner/lesson.test.ts` (empty start, persistence, notifications and unsubscribe, reset, corrupt data, unavailable storage, failed writes, changes from other tabs, migration). The deployment workflow runs them before the build.
