import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatSignedCurrency,
} from './format'

describe('formatCurrency', () => {
  it('shows whole euros without decimals', () => {
    expect(formatCurrency(1200)).toBe('€1,200')
    expect(formatCurrency(0)).toBe('€0')
  })

  it('shows two decimals otherwise', () => {
    expect(formatCurrency(250.5)).toBe('€250.50')
  })
})

describe('formatSignedCurrency', () => {
  it('always shows a sign', () => {
    expect(formatSignedCurrency(50)).toBe('+€50')
    expect(formatSignedCurrency(-20.5)).toBe('−€20.50')
  })
})

describe('date formatting', () => {
  it('formats a date without time-zone shifts', () => {
    expect(formatDate('2026-12-15')).toBe('15 Dec 2026')
  })

  it('formats a month', () => {
    expect(formatMonth('2027-03-01')).toBe('March 2027')
  })
})