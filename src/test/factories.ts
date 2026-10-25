import type { Goal, SavingsEntry } from '../types/goal'

export function makeEntry(overrides: Partial<SavingsEntry> = {}): SavingsEntry {
  return {
    id: 'entry-1',
    goalId: 'goal-1',
    amount: 10,
    entryDate: '2026-01-15',
    note: null,
    createdAt: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    title: 'Test goal',
    description: null,
    category: null,
    status: 'todo',
    targetDate: null,
    targetMonth: null,
    targetAmount: null,
    currency: 'EUR',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    completedAt: null,
    savingsEntries: [],
    links: [],
    ...overrides,
  }
}