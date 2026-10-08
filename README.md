# MEX

MEX helps job seekers prepare for job interviews in English.

Live site: https://alexanderazamvadud-spec.github.io/MEX/

## Run locally

Requires Node.js 24 (LTS).

```bash
npm install
npm run dev
```

To check the production build:

```bash
npm run build
npm run preview
```

## Folder structure

| Folder | Contents |
|---|---|
| `src/app` | Root component and router |
| `src/pages` | Screens |
| `src/i18n` | Translation setup and locale files (`locales/en.json`, `uz.json`, `ru.json`) |
| `src/styles` | Global styles (Tailwind CSS entry) |
| `public` | Static assets copied to the site as-is |
| `.github/workflows` | Build and deployment workflow |

Planned for later tasks and created when first needed: `src/components` (shared UI), `src/features` (feature modules), `src/content` (learning content as JSON).

## Translations

English is the source language. The Uzbek (Latin script) and Russian translation files are DRAFT and pending review.
