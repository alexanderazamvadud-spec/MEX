import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

// Every key path ending in a string, for example "landing.hero.title".
function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  return Object.values(value as Record<string, unknown>).flatMap(strings)
}

function withoutStatus(locale: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...locale }
  delete rest._status
  return rest
}

describe('locale files', () => {
  it('have the same keys in English, Uzbek and Russian', () => {
    const english = keyPaths(en).sort()
    expect(keyPaths(withoutStatus(uz)).sort()).toEqual(english)
    expect(keyPaths(withoutStatus(ru)).sort()).toEqual(english)
  })

  it('keep the Uzbek and Russian files marked as drafts pending review', () => {
    expect(uz._status).toMatch(/^DRAFT/)
    expect(ru._status).toMatch(/^DRAFT/)
  })

  it('write Uzbek apostrophes with U+02BB and U+02BC only', () => {
    for (const text of strings(withoutStatus(uz))) {
      expect(text, text).not.toMatch(/['‘’`]/)
    }
  })

  it('keep the product name and footer identical in every language', () => {
    for (const locale of [en, uz, ru]) {
      expect(locale.app.subtitle).toBe('Modern Employability eXperience')
      expect(locale.landing.footer.copyright).toBe('© 2026 Alexis Team LLC. All rights reserved. MEX — Modern Employability eXperience.')
    }
  })

  it('do not describe the product as Job Interview English', () => {
    expect(strings(en).join('\n')).not.toMatch(/job interview english/i)
  })
})
