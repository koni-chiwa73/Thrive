import type {
  Goal,
  GoalInput,
  GoalLinkInput,
  GoalStatus,
  SavingsEntryInput,
} from '../types/goal'
import { supabaseGoalService } from './supabaseGoalService'

/**
 * Methods that change savings entries or links resolve with the whole
 * updated goal, so callers can recalculate totals from the entries.
 * Implementations throw ServiceError for rule violations that the user
 * can understand (see errors.ts).
 */
export interface GoalService {
  listGoals(): Promise<Goal[]>
  createGoal(input: GoalInput): Promise<Goal>
  updateGoal(id: string, input: GoalInput): Promise<Goal>
  updateGoalStatus(id: string, status: GoalStatus): Promise<Goal>
  deleteGoal(id: string): Promise<void>

  addSavingsEntry(goalId: string, input: SavingsEntryInput): Promise<Goal>
  updateSavingsEntry(
    goalId: string,
    entryId: string,
    input: SavingsEntryInput,
  ): Promise<Goal>
  deleteSavingsEntry(goalId: string, entryId: string): Promise<Goal>

  addLink(goalId: string, input: GoalLinkInput): Promise<Goal>
  updateLink(goalId: string, linkId: string, input: GoalLinkInput): Promise<Goal>
  deleteLink(goalId: string, linkId: string): Promise<Goal>
}

export const goalService: GoalService = supabaseGoalService