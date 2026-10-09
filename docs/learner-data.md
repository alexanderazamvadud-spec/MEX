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

## Deleting data

Settings offers "Delete my data": a confirmation step, then the record and language choice are removed and the interface returns to English. Texts live in the locale files under `settings.*`.

## Tests

`npm test` runs the unit tests in `src/learner/localStore.test.ts` (empty start, persistence, notifications and unsubscribe, reset, corrupt data, unavailable storage, failed writes, changes from other tabs, migration). The deployment workflow runs them before the build.
