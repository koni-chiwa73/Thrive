import { describe, expect, it } from 'vitest'
import { makeEntry, makeGoal } from '../test/factories'
import {
  getBalanceCents,
  getSavingsSummary,
  isValidEntryAmount,
  sortSavingsEntries,
} from './savings'

describe('getSavingsSummary', () => {
  it('returns null when the goal has no financial target', () => {
    expect(getSavingsSummary(makeGoal({ targetAmount: null }))).toBeNull()
  })

  it('returns null for a zero target', () => {
    expect(getSavingsSummary(makeGoal({ targetAmount: 0 }))).toBeNull()
  })

  it('sums in cents without floating-point drift', () => {
    const goal = makeGoal({
      targetAmount: 1,
      savingsEntries: [
        makeEntry({ id: 'a', amount: 0.1 }),
        makeEntry({ id: 'b', amount: 0.2 }),
      ],
    })
    expect(getSavingsSummary(goal)?.saved).toBe(0.3)
  })

  it('calculates saved, remaining, and percent', () => {
    const goal = makeGoal({
      targetAmount: 1200,
      savingsEntries: [
        makeEntry({ id: 'a', amount: 150 }),
        makeEntry({ id: 'b', amount: 100.5 }),
      ],
    })
    const summary = getSavingsSummary(goal)
    expect(summary?.saved).toBe(250.5)
    expect(summary?.remaining).toBe(949.5)
    expect(summary?.percent).toBeCloseTo(20.875)
    expect(summary?.barPercent).toBeCloseTo(20.875)
    expect(summary?.reached).toBe(false)
  })

  it('caps the bar at 100% but keeps the real total when over target', () => {
    const goal = makeGoal({
      targetAmount: 180,
      savingsEntries: [makeEntry({ amount: 195 })],
    })
    const summary = getSavingsSummary(goal)
    expect(summary?.saved).toBe(195)
    expect(summary?.percent).toBeGreaterThan(100)
    expect(summary?.barPercent).toBe(100)
    expect(summary?.remaining).toBe(0)
    expect(summary?.reached).toBe(true)
  })

  it('counts exactly reaching the target as reached', () => {
    const goal = makeGoal({
      targetAmount: 100,
      savingsEntries: [makeEntry({ amount: 100 })],
    })
    const summary = getSavingsSummary(goal)
    expect(summary?.reached).toBe(true)
    expect(summary?.remaining).toBe(0)
  })

  it('subtracts withdrawals', () => {
    const goal = makeGoal({
      targetAmount: 200,
      savingsEntries: [
        makeEntry({ id: 'a', amount: 100 }),
        makeEntry({ id: 'b', amount: -30 }),
      ],
    })
    expect(getSavingsSummary(goal)?.saved).toBe(70)
  })
})

describe('getBalanceCents', () => {
  it('returns whole cents', () => {
    expect(
      getBalanceCents([{ amount: 19.99 }, { amount: -0.99 }]),
    ).toBe(1900)
  })

  it('is zero for no entries', () => {
    expect(getBalanceCents([])).toBe(0)
  })
})

describe('isValidEntryAmount', () => {
  it.each([12.34, -5, 0.01, 10_000_000])('accepts %s', (amount) => {
    expect(isValidEntryAmount(amount)).toBe(true)
  })

  it.each([0, 12.345, 10_000_001, Number.NaN, Infinity])(
    'rejects %s',
    (amount) => {
      expect(isValidEntryAmount(amount)).toBe(false)
    },
  )
})

describe('sortSavingsEntries', () => {
  const a = makeEntry({ id: 'a', entryDate: '2026-01-10', createdAt: '2026-01-10T10:00:00Z' })
  const b = makeEntry({ id: 'b', entryDate: '2026-01-12', createdAt: '2026-01-12T09:00:00Z' })
  const c = makeEntry({ id: 'c', entryDate: '2026-01-12', createdAt: '2026-01-12T11:00:00Z' })

  it('sorts newest date first, then newest creation time', () => {
    expect(sortSavingsEntries([a, b, c]).map((entry) => entry.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('does not change the original array', () => {
    const original = [a, b, c]
    sortSavingsEntries(original)
    expect(original.map((entry) => entry.id)).toEqual(['a', 'b', 'c'])
  })
})