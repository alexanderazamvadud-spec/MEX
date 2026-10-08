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

To check colour contrast after a token change:

```bash
npm run check:contrast
```

## Folder structure

| Folder | Contents |
|---|---|
| `src/app` | Root component and router |
| `src/pages` | Screens |
| `src/components/ui` | Reusable interface components (design system) |
| `src/i18n` | Translation setup and locale files (`locales/en.json`, `uz.json`, `ru.json`) |
| `src/styles` | Global styles, design tokens (`theme.css`) and the companion font |
| `docs` | Design system notes |
| `scripts` | Maintenance scripts |
| `public` | Static assets copied to the site as-is |
| `.github/workflows` | Build and deployment workflow |

Planned for later tasks and created when first needed: `src/features` (feature modules), `src/content` (learning content as JSON).

## Fonts

- Manrope, copyright 2019 The Manrope Project Authors, licensed under the SIL Open Font License 1.1. Bundled from the Fontsource package `@fontsource-variable/manrope`, which includes the licence text.
- Noto Sans, copyright 2022 The Noto Project Authors, licensed under the SIL Open Font License 1.1. Only three glyphs are used, subset into `src/styles/fonts/mex-apostrophes.woff2`: the Uzbek apostrophes ʻ (U+02BB) and ʼ (U+02BC), which Manrope does not include, and the combining acute accent (U+0301). The apostrophes render from this file in every browser; the accent is used only by browsers that choose fonts per character (Firefox), while Chromium-based browsers render a stressed Russian letter with the device font. Licence text: `src/styles/fonts/LICENSE-NotoSans.txt`.

Fonts are self-hosted and served with the site; no font service is contacted.

## Translations

English is the source language. The Uzbek (Latin script) and Russian translation files are DRAFT and pending review.
