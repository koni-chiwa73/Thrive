import type { GoalStatus } from '../types/goal'

export interface StatusConfig {
  status: GoalStatus
  label: string
  emptyMessage: string
  /** Full class names so Tailwind can detect them. */
  dotClass: string
}

export const STATUS_CONFIG: StatusConfig[] = [
  {
    status: 'todo',
    label: 'To Do',
    emptyMessage: "Nothing planned yet. Add a goal you'd like to work toward.",
    dotClass: 'bg-sand-400',
  },
  {
    status: 'in_progress',
    label: 'In Progress',
    emptyMessage: 'Your next step starts here.',
    dotClass: 'bg-honey-400',
  },
  {
    status: 'completed',
    label: 'Completed',
    emptyMessage: 'Your achievements will appear here.',
    dotClass: 'bg-sage-600',
  },
]

export function getStatusLabel(status: GoalStatus): string {
  return STATUS_CONFIG.find((config) => config.status === status)?.label ?? status
}