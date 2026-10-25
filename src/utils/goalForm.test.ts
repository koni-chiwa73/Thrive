import { describe, expect, it } from 'vitest'
import {
  EMPTY_FORM_VALUES,
  getMonthOptions,
  validateGoalForm,
} from './goalForm'
import type { GoalFormValues } from './goalForm'

function form(overrides: Partial<GoalFormValues> = {}): GoalFormValues {
  return { ...EMPTY_FORM_VALUES, title: 'Buy a sofa', ...overrides }
}

describe('validateGoalForm', () => {
  it('accepts a goal with only a title', () => {
    const result = validateGoalForm(form())
    expect(result.errors).toEqual({})
    expect(result.input).toEqual({
      title: 'Buy a sofa',
      description: null,
      category: null,
      targetDate: null,
      targetMonth: null,
      targetAmount: null,
    })
  })

  it.each(['', '   '])('requires a title (%j)', (title) => {
    expect(validateGoalForm(form({ title })).errors.title).toBeDefined()
  })

  it('rejects a title over 100 characters', () => {
    expect(validateGoalForm(form({ title: 'x'.repeat(101) })).errors.title).toBeDefined()
  })

  it.each([
    ['1200', 1200],
    ['1200.50', 1200.5],
    ['1200,5', 1200.5],
  ])('parses the amount %s', (raw, expected) => {
    expect(validateGoalForm(form({ targetAmount: raw })).input?.targetAmount).toBe(expected)
  })

  it.each(['abc', '-5', '0', '1,200', '12.345'])(
    'rejects the amount "%s"',
    (raw) => {
      const result = validateGoalForm(form({ targetAmount: raw }))
      expect(result.errors.targetAmount).toBeDefined()
      expect(result.input).toBeNull()
    },
  )

  it('keeps a specific date', () => {
    const result = validateGoalForm(
      form({ targetType: 'date', targetDate: '2026-12-15' }),
    )
    expect(result.input?.targetDate).toBe('2026-12-15')
    expect(result.input?.targetMonth).toBeNull()
  })

  it('stores a month as the first day of that month', () => {
    const result = validateGoalForm(form({ targetType: 'month', targetMonth: '2027-03' }))
    expect(result.input?.targetMonth).toBe('2027-03-01')
    expect(result.input?.targetDate).toBeNull()
  })

  it('keeps only the selected kind of target', () => {
    const result = validateGoalForm(
      form({ targetType: 'date', targetDate: '2026-12-15', targetMonth: '2027-03' }),
    )
    expect(result.input?.targetDate).toBe('2026-12-15')
    expect(result.input?.targetMonth).toBeNull()
  })

  it('requires a value once a date or month is chosen', () => {
    expect(validateGoalForm(form({ targetType: 'date' })).errors.target).toBeDefined()
    expect(validateGoalForm(form({ targetType: 'month' })).errors.target).toBeDefined()
  })

  it('rejects an impossible date', () => {
    const result = validateGoalForm(
      form({ targetType: 'date', targetDate: '2026-02-30' }),
    )
    expect(result.errors.target).toBeDefined()
  })
})

describe('getMonthOptions', () => {
  const now = new Date(2026, 9, 23) // 23 Oct 2026

  it('lists 48 months starting with the current one', () => {
    const options = getMonthOptions('', 48, now)
    expect(options).toHaveLength(48)
    expect(options[0].value).toBe('2026-10')
    expect(options[47].value).toBe('2030-09')
  })

  it('keeps an existing month that is outside the range', () => {
    const options = getMonthOptions('2019-05', 48, now)
    expect(options).toHaveLength(49)
    expect(options[0].value).toBe('2019-05')
  })
})