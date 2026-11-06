// Checks WCAG 2.x contrast for the MEX colour tokens defined in src/styles/theme.css.
// Run with: npm run check:contrast
// Text pairs need 4.5:1; non-text pairs (rings, borders, bars, outlines) need 3:1.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '..', 'src', 'styles', 'theme.css'), 'utf8')

const tokens = {}
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/g)) {
  tokens[match[1]] = match[2].toUpperCase()
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((value) => {
    const s = value / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function ratio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// [foreground token, background token, minimum ratio, what the pair is used for]
const pairs = [
  ['ink', 'canvas', 4.5, 'body text on the grey page canvas'],
  ['ink', 'surface', 4.5, 'text on white cards and panels'],
  ['ink', 'surface-soft', 4.5, 'text on soft cards'],
  ['ink', 'surface-sky', 4.5, 'text on sky cards'],
  ['ink', 'accent-tint', 4.5, 'text on accent-tint cards'],
  ['ink-secondary', 'canvas', 4.5, 'secondary text on the page canvas'],
  ['ink-secondary', 'surface', 4.5, 'secondary text on white cards, secondary-button labels'],
  ['ink', 'surface-soft-hover', 4.5, 'hovered secondary-button labels and hovered white cards'],
  ['ink-secondary', 'surface-muted', 4.5, 'neutral badges (Not started)'],
  ['ink-secondary', 'surface-soft', 4.5, 'secondary text on soft cards'],
  ['ink-secondary', 'surface-sky', 4.5, 'secondary text on sky cards'],
  ['ink-muted', 'surface', 4.5, 'muted text on the page'],
  ['ink-muted', 'surface-soft', 4.5, 'muted text on soft cards'],
  ['ink-muted', 'surface-muted', 4.5, 'disabled button labels'],
  ['ink-muted', 'canvas', 4.5, 'muted text on the page canvas'],
  ['ink-muted', 'surface-sky', 4.5, 'muted text on sky cards'],
  ['on-primary', 'primary', 4.5, 'label on primary buttons, text on primary cards'],
  ['on-primary', 'primary-hover', 4.5, 'label on hovered primary buttons'],
  ['on-primary-muted', 'primary', 4.5, 'muted text on primary cards'],
  ['primary', 'canvas', 4.5, 'links on the page canvas'],
  ['primary', 'surface', 4.5, 'links on white cards, label on white (inverse) buttons on blue'],
  ['primary-hover', 'surface-sky', 4.5, 'selected chips and the language pill'],
  ['primary-hover', 'surface-sky-hover', 4.5, 'hovered selected chips and language pill'],
  ['ink', 'surface-sky-hover', 4.5, 'text on hovered chosen choice cards'],
  ['error-text', 'surface', 4.5, 'destructive-button label'],
  ['primary', 'surface-soft', 4.5, 'links on soft cards'],
  ['primary', 'surface-sky', 4.5, 'links and badges on sky cards, hovered inverse buttons'],
  ['primary', 'accent-tint', 4.5, 'links on orange alert cards'],
  ['primary-hover', 'surface', 4.5, 'hovered links'],
  ['on-accent-tint', 'accent-tint', 4.5, 'badge text on the orange alert tint'],
  ['success-text', 'success-tint', 4.5, 'success messages'],
  ['error-text', 'error-tint', 4.5, 'error messages and destructive buttons'],
  ['error-text', 'error-tint-hover', 4.5, 'hovered destructive buttons'],
  ['warning-text', 'warning-tint', 4.5, 'warning messages'],
  ['info-text', 'info-tint', 4.5, 'info messages'],
  ['outline', 'canvas', 3, 'control outlines on the page canvas'],
  ['outline', 'surface', 3, 'control outlines on white cards'],
  ['outline', 'surface-soft', 3, 'control outlines on soft cards'],
  ['outline', 'surface-sky', 3, 'control outlines on sky cards'],
  ['primary', 'canvas', 3, 'focus ring on the page canvas'],
  ['primary', 'surface', 3, 'focus ring on white cards; selected-choice border'],
  ['primary', 'surface-sky', 3, 'selected-choice border on its blue tint'],
  ['primary', 'surface-soft', 3, 'focus ring on soft cards'],
  ['primary', 'accent-tint', 3, 'focus ring on accent-tint cards'],
  ['on-primary', 'primary', 3, 'focus ring inside primary cards'],
  ['primary', 'track', 3, 'progress fill on the light track'],
  ['on-primary', 'track-on-primary', 3, 'white progress fill on primary cards'],
  ['on-primary-muted', 'primary', 3, 'outline of the white-outline button on blue'],
  ['success-border', 'success-tint', 3, 'success panel border'],
  ['error-border', 'error-tint', 3, 'error panel border'],
  // Exercise feedback (MVP-10): text, native explanations, dropdown outlines and focus on the
  // right/wrong panels, and the check or cross in a marked option.
  ['ink', 'success-tint', 4.5, 'text on right-answer panels'],
  ['ink', 'error-tint', 4.5, 'text on wrong-answer panels'],
  ['ink-secondary', 'success-tint', 4.5, 'native explanation on right-answer panels'],
  ['ink-secondary', 'error-tint', 4.5, 'native explanation on wrong-answer panels'],
  ['outline', 'success-tint', 3, 'dropdown outline on a right matching pair'],
  ['outline', 'error-tint', 3, 'dropdown outline on a wrong matching pair'],
  ['primary', 'success-tint', 3, 'focus ring on right-answer panels'],
  ['primary', 'error-tint', 3, 'focus ring on wrong-answer panels'],
  ['on-primary', 'success-border', 3, 'check icon in a right option'],
  ['on-primary', 'error-border', 3, 'cross icon in a wrong option'],
]

let failures = 0
for (const [fg, bg, need, usage] of pairs) {
  if (!tokens[fg] || !tokens[bg]) {
    console.log(`??     missing token: ${fg} or ${bg}`)
    failures++
    continue
  }
  const r = ratio(tokens[fg], tokens[bg])
  const ok = r >= need
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}  (need ${need})  ${fg} on ${bg}: ${usage}`)
}

console.log(`\n${pairs.length} pairs checked, ${failures} failing`)
process.exit(failures === 0 ? 0 : 1)
