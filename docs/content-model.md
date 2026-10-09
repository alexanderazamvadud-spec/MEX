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
| writing-checklist | `writing-task` (task, model, checklist) |

Every exercise and comprehension question carries an `explanation` shown after the answer.

## Languages

Teaching content (phrases, dialogues, texts, questions, model answers) is English. Instructions, explanations, summaries, prompts and self-check lines are `LocalizedText` objects: `en` is required, `uz` and `ru` are optional native-language versions. The learner can switch these on or off; the default is on for Beginner and off for other levels (owner decision Q3). Uzbek uses the Latin script with U+02BB (ʻ) in oʻ and gʻ and U+02BC (ʼ) for the tutuq belgisi (feʼl, maʼlumot); never an ASCII apostrophe or a typographic quotation mark. The check script does not enforce this yet, so authors must type the correct characters.

## Placeholder content rules (Scope v2, Section 5.3)

- All Phase 1 content is written fresh for development and marked `content_status: "placeholder"` and `license: "placeholder"`.
- It must not be copied, paraphrased or reconstructed from MEX books or methodologies. Real content is delivered later by a method the owner approves; local drafts go in the ignored `content-private/` folder.
- The interface shows a "Sample content" badge wherever placeholder content appears (`isPlaceholder()` in `src/content/index.ts`).

## Checking

`npm run check:content` validates every pack against the schema and these extra rules: a pack exists for every pathway, ids unique within a pack, pack id and pathway equal to the file name, item kinds allowed for their activity type, every answer present among its options, exactly one `___` gap per gap-fill sentence, unique matching sides. Schema errors are reported first; the extra rules run once the schema passes. The deployment workflow runs the same check before building, so a broken pack cannot be published. To test a draft file outside the packs folder: `node scripts/check-content.mjs path/to/file.json` (the file-name rules are skipped for explicit files).

## Loading in the app

`loadPack(pathway)` in `src/content/index.ts` imports the pack on demand (it is not part of the shell bundle). Helpers: `findUnit`, `findActivity`, `countItems`, `itemsOfKind`, `isPlaceholder`, `explanationsDefaultOn`, plus the `PATHWAY_IDS` and `LEVELS` lists.

## Current packs

| Pack | Unit | Activities |
|---|---|---|
| general-english | ge-01-meeting-people | lesson (6 phrases, grammar note, dialogue), exercise set (4 items), reading (3 questions), speaking prompt |
| career-readiness | cr-01-professional-self-introduction | lesson (6 phrases, grammar note, dialogue), exercise set (4 items), speaking prompt, interview practice (3 questions) |

The remaining approved unit topics (General English: Daily routines, Shopping and services, Talking about past experiences; Career Readiness: Job interview basics, Workplace communication, Professional emails) are added by later tasks.
