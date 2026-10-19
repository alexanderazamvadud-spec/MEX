import { describe, expect, it } from 'vitest'
import { formatAverage, formatDay } from './format.ts'

describe('Progress formats', () => {
  it('writes dates in each interface language', () => {
    const iso = '2026-10-04T12:00:00.000Z'
    expect(formatDay(iso, 'en')).toBe('4 October 2026')
    expect(formatDay(iso, 'uz')).toBe('4-oktabr, 2026')
    expect(formatDay(iso, 'ru')).toBe('4 октября 2026 г.')
  })

  it('rounds averages down to one decimal', () => {
    expect(formatAverage(11 / 3, 'en')).toBe('3.6')
    expect(formatAverage(3.99, 'en')).toBe('3.9')
    expect(formatAverage(4, 'en')).toBe('4.0')
    expect(formatAverage(4.5, 'ru')).toBe('4,5')
  })
})
