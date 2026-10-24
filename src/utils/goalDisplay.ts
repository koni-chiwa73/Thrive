import { BookOpen, House, Sparkles, Tag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Goal, GoalCategory } from '../types/goal'
import { formatDate, formatMonth } from './format'

export const CATEGORY_ICONS: Record<GoalCategory, LucideIcon> = {
  Home: House,
  Personal: Sparkles,
  Learning: BookOpen,
  Other: Tag,
}

/** "15 Dec 2026", "March 2027", or null when the goal has no target. */
export function getTargetLabel(goal: Goal): string | null {
  if (goal.targetDate) return formatDate(goal.targetDate)
  if (goal.targetMonth) return formatMonth(goal.targetMonth)
  return null
}