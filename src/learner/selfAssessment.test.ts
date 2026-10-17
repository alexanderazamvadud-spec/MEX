import { describe, expect, it } from 'vitest'
import { newSelfAssessmentId, withSelfAssessment } from './selfAssessment.ts'
import { createEmptyRecord, type SelfAssessment } from './types.ts'

const entry = (id: string): SelfAssessment => ({
  id,
  kind: 'speaking',
  pathway: 'general-english',
  activityId: 'a',
  itemId: 'i',
  skills: ['speaking'],
  selfCheck: [true, false],
  recordedAt: '2026-10-17T00:00:00.000Z',
})

describe('withSelfAssessment', () => {
  it('appends without changing earlier entries or the original record', () => {
    const record = createEmptyRecord()
    const once = withSelfAssessment(record, entry('one'))
    const twice = withSelfAssessment(once, entry('two'))
    expect(record.selfAssessments).toEqual([])
    expect(twice.selfAssessments.map((item) => item.id)).toEqual(['one', 'two'])
    expect(twice.selfAssessments[0]).toBe(once.selfAssessments[0])
  })
})

describe('newSelfAssessmentId', () => {
  it('is unique for the same moment', () => {
    const now = '2026-10-17T00:00:00.000Z'
    expect(newSelfAssessmentId(now)).toMatch(/^sa-2026-10-17T00:00:00.000Z-/)
    expect(newSelfAssessmentId(now)).not.toBe(newSelfAssessmentId(now))
  })
})
