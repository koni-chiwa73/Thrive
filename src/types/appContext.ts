import type { Goal, GoalStatus } from './goal'

/** Data and actions AppLayout shares with the pages rendered inside it. */
export interface AppOutletContext {
  goals: Goal[]
  isLoading: boolean
  loadError: string | null
  busyGoalIds: ReadonlySet<string>
  onRetry: () => void
  onOpenGoal: (goalId: string) => void
  onStatusChange: (goal: Goal, status: GoalStatus) => void
}