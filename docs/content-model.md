# MEX content model

How learning content is stored, checked and labelled. The authoritative shapes are `src/content/types.ts` and the JSON schema `src/content/schema/content-pack.schema.json`; this page explains them for content authors.

## Structure

```
Content pack (one per pathway)
 └─ Unit
     └─ Activity (lesson | exercise | reading | listening | speaking | interview-practice | writing-checklist)
         └─ Items
```

Packs live in `src/content/packs/<pathway>.json`. The pack id and its `pathway` field must equal the file name. Pathways: `general-english`, `career-readiness`.

Every item carries:

| Field | Values | Meaning |
|---|---|---|
| `id` | kebab-case, unique within the pack | Stable reference for progress tracking |
| `skills` | vocabulary, grammar, reading, listening, speaking, writing, interaction | What the item practises; progress is reported per skill |
| `level` | beginner, elementary, intermediate | Plain words only; MEX never shows CEFR codes because it has not tested anyone's level (owner decision Q9) |
| `content_status` | placeholder, draft, approved | Placeholder content is shown with a "Sample content" label |
| `license` | placeholder, mex-proprietary, open | Items marked mex-proprietary must never be committed to this public repository |

## Item kinds by activity type

| Activity type | Item kinds |
|---|---|
| lesson | `phrase` (phrase, example, optional note), `grammar-note` (title, explanation, examples), `dialogue` (title, lines) |
| exercise | `multiple-choice`, `gap-fill` (sentence with one `___`), `matching` (pairs), `ordering` (segments in the correct order; the player shuffles) |
| reading | `reading` (title, text, questions) |
| listening | `listening` (title, transcript to be read aloud, questions); no samples until decision Q5 |
| speaking | `speaking` (prompt, preparation hints, model answer, self-check list) |
| interview-practice | `interview-question` (question, model answers, useful phrases, self-check list) |
| writing-checklist | `writing-task` (task, model email, checklist); played as "Writing practice" since MVP-16b |

Every exercise and comprehension question carries an `explanation` shown after the answer.

## Languages

Teaching content (phrases, dialogues, texts, questions, model answers) is English. Instructions, explanations, summaries, prompts and self-check lines are `LocalizedText` objects: `en` is required, `uz` and `ru` are optional native-language versions. The learner can switch these on or off; the default is on for Beginner and off for other levels (owner decision Q3). In the lesson viewer (MVP-09) the native language is the interface language, the native version appears under the English, and the switch covers instructions, phrase notes and grammar explanations. Uzbek uses the Latin script with U+02BB (ʻ) in oʻ and gʻ and U+02BC (ʼ) for the tutuq belgisi (feʼl, maʼlumot); never an ASCII apostrophe or a typographic quotation mark. The check script does not enforce this yet, so authors must type the correct characters.

## Exercise player (MVP-10)

Exercise activities are played one item per screen at `#/learn/:pathway/:unit/:activity` (the same address as lessons; `ActivityPage` picks the player from the activity type). Multiple choice and gap-fill options keep pack order. Matching right-hand texts and ordering segments are shown in a fixed shuffled order (`shuffled` in `src/learner/exercise.ts`, seeded by the item id), never already solved. An item is correct only when the option, every pair, or the whole order is right. After Check the learner sees right or wrong, the right answer when wrong, and the item's `explanation`. Prompts and options stay English; the native switch adds the UZ/RU instructions and explanations.

## Reading and listening players (MVP-11)

Reading and listening items use the same question flow as exercises: each `ComprehensionQuestion` is played as a multiple-choice item with the id `<item id>-q<n>` and the item's `skills` (`comprehensionItems` in `src/learner/exercise.ts`). The reading `text` stays above every question. The listening `transcript` is spoken by an on-device English voice (`src/learner/speech.ts`, decision Q5); a line break in the transcript starts a new paragraph when the text is shown. Text and transcripts stay English.

## Speaking player (MVP-12)

Each `speaking` item is one task on a single screen: the prompt, the `preparationHints`, a 60-second preparation timer and a 30-second speaking timer (guides only; they never block), optional on-device recording, the `modelAnswer` on request, and the `selfCheck` list as tick boxes. The prompt and self-check lines have UZ/RU versions under the native switch; hints and the model answer stay English. The model answer can be heard with the same on-device voice as listening, when one exists.

## Interview practice player (MVP-13)

Each `interview-question` item is one screen ("Question 1 of 3"): the `question` (heard with an on-device English voice when one exists), the `usefulPhrases`, a typed answer and the MVP-12 recorder, both optional, the two `modelAnswers` on request, the `selfCheck` list as tick boxes, and an optional 1 to 5 confidence. The question, phrases and model answers stay English; the native switch adds the UZ/RU instructions and self-check lines.

**Answer keys are public.** The `answer`, `pairs` and `segments` fields, and the answers of reading and listening questions, ship to the browser in the pack, so anyone can read them. The owner accepted this on 2026-10-17 only for placeholder exercises. Real MEX exercises must not be added this way: they need the protected-delivery decision C-04 (Scope v2, Section 6.3) first.

## Placeholder content rules (Scope v2, Section 5.3)

- All Phase 1 content is written fresh for development and marked `content_status: "placeholder"` and `license: "placeholder"`.
- It must not be copied, paraphrased or reconstructed from MEX books or methodologies. Real content is delivered later by a method the owner approves; local drafts go in the ignored `content-private/` folder.
- The interface shows a "Sample content" badge wherever placeholder content appears (`isPlaceholder()` in `src/content/index.ts`).
- Since MVP-16b `npm run check:content` enforces this: in a pack whose status is placeholder, every item must have `content_status` and `license` set to `placeholder`.
- Since MVP-18 the test `src/pages/SampleContentLabels.test.tsx` renders Home, the pathway overview, every unit overview and every activity of both packs in EN, UZ and RU, and fails if any of them lacks the "Sample content" label while the pack is placeholder.
- Phase 1 has four placeholder units per pathway (MVP-16b), on the Scope v2 topics: General English (Introductions, Daily routines, Shopping and services, Past experiences) and Career Readiness (Introducing yourself professionally, Job interview basics, Workplace communication, Professional emails).

## Checking

`npm run check:content` validates every pack against the schema and these extra rules: a pack exists for every pathway, ids unique within a pack, pack id and pathway equal to the file name, item kinds allowed for their activity type, every answer present among its options, exactly one `___` gap per gap-fill sentence, unique matching sides, and placeholder status and licence on every item of a placeholder pack. Schema errors are reported first; the extra rules run once the schema passes. The deployment workflow runs the same check before building, so a broken pack cannot be published. To test a draft file outside the packs folder: `node scripts/check-content.mjs path/to/file.json` (the file-name rules are skipped for explicit files).

## Loading in the app

`loadPack(pathway)` in `src/content/index.ts` imports the pack on demand (it is not part of the shell bundle). Helpers: `findUnit`, `findActivity`, `countItems`, `itemsOfKind`, `isPlaceholder`, `explanationsDefaultOn`, plus the `PATHWAY_IDS` and `LEVELS` lists.

## Current packs

| Pack | Unit | Activities |
|---|---|---|
| general-english | ge-01-meeting-people | lesson (6 phrases, grammar note, dialogue), exercise set (4 items), reading (3 questions), listening (3 questions, added in MVP-11), speaking prompt |
| career-readiness | cr-01-professional-self-introduction | lesson (6 phrases, grammar note, dialogue), exercise set (4 items), speaking prompt, interview practice (3 questions) |

The remaining approved unit topics (General English: Daily routines, Shopping and services, Talking about past experiences; Career Readiness: Job interview basics, Workplace communication, Professional emails) are added by later tasks.
