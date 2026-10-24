export const GOAL_CATEGORIES = ['Home', 'Personal', 'Learning', 'Other'] as const

export type GoalCategory = (typeof GOAL_CATEGORIES)[number]

export type GoalStatus = 'todo' | 'in_progress' | 'completed'

export interface SavingsEntry {
  id: string
  goalId: string
  /** Positive = money saved. Negative = withdrawal/correction. Never zero. */
  amount: number
  /** Date only, ISO format: YYYY-MM-DD */
  entryDate: string
  note: string | null
  createdAt: string
}

export interface GoalLink {
  id: string
  goalId: string
  /** Optional custom display name. */
  title: string | null
  url: string
  note: string | null
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  description: string | null
  category: GoalCategory | null
  status: GoalStatus
  /** Date only, YYYY-MM-DD */
  targetDate: string | null
  /** Month-level target stored as the first day of the month, YYYY-MM-01 */
  targetMonth: string | null
  targetAmount: number | null
  currency: 'EUR'
  createdAt: string
  updatedAt: string
  completedAt: string | null
  /** The saved total is always calculated from these, never stored. */
  savingsEntries: SavingsEntry[]
  links: GoalLink[]
}

/** The fields a user can set when creating or editing a goal. */
export interface GoalInput {
  title: string
  description: string | null
  category: GoalCategory | null
  /** At most one of targetDate / targetMonth is ever set. */
  targetDate: string | null
  targetMonth: string | null
  targetAmount: number | null
}

export interface SavingsEntryInput {
  /** Signed: positive for savings, negative for a withdrawal. */
  amount: number
  entryDate: string
  note: string | null
}

export interface GoalLinkInput {
  url: string
  title: string | null
  note: string | null
}

/** Handlers and state the board passes down to every goal card. */
export interface GoalBoardActions {
  onOpen: (goalId: string) => void
  onStatusChange: (goal: Goal, status: GoalStatus) => void
  busyGoalIds: ReadonlySet<string>
}

/**
 * Savings and link operations used inside the details dialog.
 * Each one shows its own success feedback and throws on failure,
 * so the calling form or dialog can show the error in place.
 */
export interface GoalDetailsActions {
  addSavingsEntry: (goalId: string, input: SavingsEntryInput) => Promise<void>
  updateSavingsEntry: (
    goalId: string,
    entryId: string,
    input: SavingsEntryInput,
  ) => Promise<void>
  deleteSavingsEntry: (goalId: string, entryId: string) => Promise<void>
  addLink: (goalId: string, input: GoalLinkInput) => Promise<void>
  updateLink: (
    goalId: string,
    linkId: string,
    input: GoalLinkInput,
  ) => Promise<void>
  deleteLink: (goalId: string, linkId: string) => Promise<void>
}