import { describe, expect, it } from 'vitest'
import { makeEntry } from '../test/factories'
import { todayISO } from './dates'
import { createEmptySavingsValues, validateSavingsForm } from './savingsForm'
import type { SavingsFormValues } from './savingsForm'

function values(overrides: Partial<SavingsFormValues> = {}): SavingsFormValues {
  return { ...createEmptySavingsValues(), amount: '50', ...overrides }
}

describe('validateSavingsForm', () => {
  it('accepts a valid deposit', () => {
    const result = validateSavingsForm(values(), [], null)
    expect(result.errors).toEqual({})
    expect(result.input).toEqual({
      amount: 50,
      entryDate: todayISO(),
      note: null,
    })
  })

  it('accepts a comma as the decimal separator', () => {
    const result = validateSavingsForm(values({ amount: '49,90' }), [], null)
    expect(result.input?.amount).toBe(49.9)
  })

  it('stores a withdrawal as a negative amount', () => {
    const entries = [makeEntry({ amount: 100 })]
    const result = validateSavingsForm(
      values({ kind: 'withdrawal', amount: '100' }),
      entries,
      null,
    )
    expect(result.input?.amount).toBe(-100)
  })

  it.each(['', 'abc', '0', '-5', '12.345', '1,200'])(
    'rejects the amount "%s"',
    (amount) => {
      const result = validateSavingsForm(values({ amount }), [], null)
      expect(result.errors.amount).toBeDefined()
      expect(result.input).toBeNull()
    },
  )

  it('rejects a withdrawal larger than the balance', () => {
    const entries = [makeEntry({ amount: 100 })]
    const result = validateSavingsForm(
      values({ kind: 'withdrawal', amount: '150' }),
      entries,
      null,
    )
    expect(result.errors.amount).toContain('€100')
    expect(result.input).toBeNull()
  })

  it('explains when there is nothing to withdraw', () => {
    const result = validateSavingsForm(
      values({ kind: 'withdrawal', amount: '10' }),
      [],
      null,
    )
    expect(result.errors.amount).toBe('There is nothing available to withdraw yet.')
  })

  it('ignores the entry being edited when checking the balance', () => {
    const entries = [
      makeEntry({ id: 'a', amount: 100 }),
      makeEntry({ id: 'b', amount: -60 }),
    ]
    const tooLow = validateSavingsForm(values({ amount: '40' }), entries, 'a')
    expect(tooLow.errors.amount).toContain('€60')
    expect(tooLow.input).toBeNull()

    const enough = validateSavingsForm(values({ amount: '60' }), entries, 'a')
    expect(enough.errors).toEqual({})
    expect(enough.input?.amount).toBe(60)
  })

  it('rejects a future date', () => {
    const result = validateSavingsForm(values({ entryDate: '2099-01-01' }), [], null)
    expect(result.errors.entryDate).toBe("Entries can't be dated in the future.")
  })

  it('rejects an impossible date', () => {
    const result = validateSavingsForm(values({ entryDate: '2026-02-30' }), [], null)
    expect(result.errors.entryDate).toBe('Enter a valid date.')
  })

  it('rejects an overlong note and turns a blank note into null', () => {
    const tooLong = validateSavingsForm(values({ note: 'x'.repeat(201) }), [], null)
    expect(tooLong.errors.note).toBeDefined()

    const blank = validateSavingsForm(values({ note: '   ' }), [], null)
    expect(blank.input?.note).toBeNull()
  })
})