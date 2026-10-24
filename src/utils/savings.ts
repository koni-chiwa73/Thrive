import type { Goal, SavingsEntry } from '../types/goal'

export const MAX_ENTRY_AMOUNT = 10_000_000

export interface SavingsSummary {
  /** Actual total saved. Never capped. */
  saved: number
  target: number
  /** Never negative. */
  remaining: number
  /** Actual percentage, may exceed 100. */
  percent: number
  /** Percentage for the progress bar, capped at 100. */
  barPercent: number
  reached: boolean
}

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Sums in whole cents to avoid floating-point errors. */
export function getBalanceCents(
  entries: ReadonlyArray<Pick<SavingsEntry, 'amount'>>,
): number {
  return entries.reduce((sum, entry) => sum + toCents(entry.amount), 0)
}

/** Non-zero, within limits, and at most two decimal places. */
export function isValidEntryAmount(amount: number): boolean {
  if (!Number.isFinite(amount) || amount === 0) return false
  if (Math.abs(amount) > MAX_ENTRY_AMOUNT) return false
  return Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6
}

/** Newest entry date first; ties broken by when the entry was created. */
export function sortSavingsEntries(entries: SavingsEntry[]): SavingsEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.entryDate.localeCompare(a.entryDate) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
}

/**
 * Returns null when the goal has no financial target,
 * so the UI never shows an empty savings bar.
 */
export function getSavingsSummary(goal: Goal): SavingsSummary | null {
  if (goal.targetAmount === null || goal.targetAmount <= 0) return null

  const targetCents = toCents(goal.targetAmount)
  const savedCents = getBalanceCents(goal.savingsEntries)
  const percent = (savedCents / targetCents) * 100

  return {
    saved: savedCents / 100,
    target: targetCents / 100,
    remaining: Math.max(targetCents - savedCents, 0) / 100,
    percent,
    barPercent: Math.min(Math.max(percent, 0), 100),
    reached: savedCents >= targetCents,
  }
}