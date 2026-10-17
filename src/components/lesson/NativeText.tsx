import type { LocalizedText } from '../../content/index.ts'

// The native-language version of an instruction, note or explanation, shown under the
// English text while the toggle is on. Nothing is shown when the pack has no version.
export default function NativeText({ text, language }: { text: LocalizedText; language: 'uz' | 'ru' | null }) {
  const value = language ? text[language] : undefined
  if (!value) return null
  return (
    <p lang={language ?? undefined} data-native="true" className="border-l-4 border-track pl-3 text-body text-ink-secondary">
      {value}
    </p>
  )
}
