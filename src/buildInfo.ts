// Build details for Settings > About, filled in by vite.config.ts at build time (MVP-17).
declare const __MEX_BUILD__: { version: string; commit: string; date: string }

export const BUILD_INFO = __MEX_BUILD__
