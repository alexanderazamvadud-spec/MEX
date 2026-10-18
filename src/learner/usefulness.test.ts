import { describe, expect, it } from 'vitest'
import { createEmptyRecord } from './types.ts'
import { withUsefulnessRating } from './usefulness.ts'

describe('withUsefulnessRating', () => {
  it('adds a rating, changes the one from the same summary in place, and keeps earlier visits', () => {
    const record = createEmptyRecord()
    const first = withUsefulnessRating(record, { activityId: 'a', rating: 4, ratedAt: 't1' })
    const changed = withUsefulnessRating(first, { activityId: 'a', rating: 2, ratedAt: 't1' })
    const later = withUsefulnessRating(changed, { activityId: 'a', rating: 5, ratedAt: 't2' })
    expect(record.usefulnessRatings).toEqual([])
    expect(changed.usefulnessRatings).toEqual([{ activityId: 'a', rating: 2, ratedAt: 't1' }])
    expect(later.usefulnessRatings.map((entry) => entry.rating)).toEqual([2, 5])
  })

  it('changes nothing else in the record', () => {
    const record = createEmptyRecord()
    const rated = withUsefulnessRating(record, { activityId: 'a', rating: 3, ratedAt: 't1' })
    expect({ ...rated, usefulnessRatings: [] }).toEqual(record)
  })
})
