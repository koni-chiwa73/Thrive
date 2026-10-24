import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { GOAL_CATEGORIES } from '../types/goal'
import type {
  Goal,
  GoalCategory,
  GoalInput,
  GoalLink,
  GoalLinkInput,
  GoalStatus,
  SavingsEntry,
  SavingsEntryInput,
} from '../types/goal'
import { ServiceError } from './errors'
import type { GoalService } from './goalService'

// ---- Row shapes: these mirror the SQL tables ------------------------------
// (Phase 6 option: generate them with `supabase gen types`.)

interface SavingsEntryRow {
  id: string
  goal_id: string
  amount: number
  entry_date: string
  note: string | null
  created_at: string
}

interface GoalLinkRow {
  id: string
  goal_id: string
  title: string | null
  url: string
  note: string | null
  created_at: string
}

interface GoalRow {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  target_date: string | null
  target_month: string | null
  target_amount: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
  savings_entries: SavingsEntryRow[] | null
  goal_links: GoalLinkRow[] | null
}

/** One query returns a goal together with its entries and links. */
const GOAL_SELECT = '*, savings_entries(*), goal_links(*)'

// ---- Mapping (snake_case rows -> camelCase app types) ---------------------

function parseStatus(value: string): GoalStatus {
  if (value === 'todo' || value === 'in_progress' || value === 'completed') {
    return value
  }
  throw new Error(`Unexpected goal status: ${value}`)
}

function parseCategory(value: string | null): GoalCategory | null {
  return GOAL_CATEGORIES.find((category) => category === value) ?? null
}

function mapEntry(row: SavingsEntryRow): SavingsEntry {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: row.amount,
    entryDate: row.entry_date,
    note: row.note,
    createdAt: row.created_at,
  }
}

function mapLink(row: GoalLinkRow): GoalLink {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    url: row.url,
    note: row.note,
    createdAt: row.created_at,
  }
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: parseCategory(row.category),
    status: parseStatus(row.status),
    targetDate: row.target_date,
    targetMonth: row.target_month,
    targetAmount: row.target_amount,
    currency: 'EUR',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    savingsEntries: (row.savings_entries ?? []).map(mapEntry),
    links: (row.goal_links ?? [])
      .map(mapLink)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
  }
}

function toGoalPayload(input: GoalInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    target_date: input.targetDate,
    target_month: input.targetMonth,
    target_amount: input.targetAmount,
  }
}

// ---- Error handling -------------------------------------------------------

/**
 * Turns a database error into a ServiceError (friendly message) when it is
 * one of our own rules, and into a plain Error otherwise. The UI shows a
 * generic message for plain errors; the details go to the console.
 */
function fail(error: PostgrestError): never {
  switch (error.code) {
    case 'TH001':
      throw new ServiceError('This would take your savings below zero.')
    case 'TH002':
      throw new ServiceError(
        "This entry can't be removed because later withdrawals depend on it. Adjust or remove those first.",
      )
    case 'TH003':
      throw new ServiceError("Entries can't be dated in the future.")
    case '23514': // check_violation
      throw new ServiceError(
        "Some of those details aren't allowed. Please check them and try again.",
      )
    default:
      console.error('[goalService]', error)
      throw new Error(error.message)
  }
}

/** An update or delete that matches no rows means "not found / not yours". */
function assertAffected(rows: unknown[] | null, what: string): void {
  if (!rows || rows.length === 0) throw new Error(`${what} not found`)
}

async function fetchGoal(id: string): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .select(GOAL_SELECT)
    .eq('id', id)
    .single()
  if (error) fail(error)
  return mapGoal(data as GoalRow)
}

// ---- The service ----------------------------------------------------------

export const supabaseGoalService: GoalService = {
  async listGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select(GOAL_SELECT)
      .order('created_at', { ascending: false })
    if (error) fail(error)
    return ((data ?? []) as GoalRow[]).map(mapGoal)
  },

  async createGoal(input: GoalInput) {
    // user_id, status, and timestamps are filled in by the database.
    const { data, error } = await supabase
      .from('goals')
      .insert(toGoalPayload(input))
      .select(GOAL_SELECT)
      .single()
    if (error) fail(error)
    return mapGoal(data as GoalRow)
  },

  async updateGoal(id: string, input: GoalInput) {
    const { data, error } = await supabase
      .from('goals')
      .update(toGoalPayload(input))
      .eq('id', id)
      .select(GOAL_SELECT)
      .single()
    if (error) fail(error)
    return mapGoal(data as GoalRow)
  },

  async updateGoalStatus(id: string, status: GoalStatus) {
    // completed_at is maintained by a database trigger.
    const { data, error } = await supabase
      .from('goals')
      .update({ status })
      .eq('id', id)
      .select(GOAL_SELECT)
      .single()
    if (error) fail(error)
    return mapGoal(data as GoalRow)
  },

  async deleteGoal(id: string) {
    // Entries and links are removed by the database (ON DELETE CASCADE).
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) fail(error)
    assertAffected(data, 'Goal')
  },

  // ---- Savings entries ----

  async addSavingsEntry(goalId: string, input: SavingsEntryInput) {
    const { error } = await supabase.from('savings_entries').insert({
      goal_id: goalId,
      amount: input.amount,
      entry_date: input.entryDate,
      note: input.note,
    })
    if (error) fail(error)
    return fetchGoal(goalId)
  },

  async updateSavingsEntry(
    goalId: string,
    entryId: string,
    input: SavingsEntryInput,
  ) {
    const { data, error } = await supabase
      .from('savings_entries')
      .update({
        amount: input.amount,
        entry_date: input.entryDate,
        note: input.note,
      })
      .eq('id', entryId)
      .eq('goal_id', goalId)
      .select('id')
    if (error) fail(error)
    assertAffected(data, 'Entry')
    return fetchGoal(goalId)
  },

  async deleteSavingsEntry(goalId: string, entryId: string) {
    const { data, error } = await supabase
      .from('savings_entries')
      .delete()
      .eq('id', entryId)
      .eq('goal_id', goalId)
      .select('id')
    if (error) fail(error)
    assertAffected(data, 'Entry')
    return fetchGoal(goalId)
  },

  // ---- Links ----

  async addLink(goalId: string, input: GoalLinkInput) {
    const { error } = await supabase.from('goal_links').insert({
      goal_id: goalId,
      url: input.url,
      title: input.title,
      note: input.note,
    })
    if (error) fail(error)
    return fetchGoal(goalId)
  },

  async updateLink(goalId: string, linkId: string, input: GoalLinkInput) {
    const { data, error } = await supabase
      .from('goal_links')
      .update({ url: input.url, title: input.title, note: input.note })
      .eq('id', linkId)
      .eq('goal_id', goalId)
      .select('id')
    if (error) fail(error)
    assertAffected(data, 'Link')
    return fetchGoal(goalId)
  },

  async deleteLink(goalId: string, linkId: string) {
    const { data, error } = await supabase
      .from('goal_links')
      .delete()
      .eq('id', linkId)
      .eq('goal_id', goalId)
      .select('id')
    if (error) fail(error)
    assertAffected(data, 'Link')
    return fetchGoal(goalId)
  },
}