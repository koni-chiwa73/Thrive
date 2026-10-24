import { CalendarDays, CircleCheck } from 'lucide-react'
import type { Goal, GoalBoardActions } from '../../types/goal'
import { formatTimestamp } from '../../utils/format'
import { CATEGORY_ICONS, getTargetLabel } from '../../utils/goalDisplay'
import { getSavingsSummary } from '../../utils/savings'
import SavingsProgress from '../savings/SavingsProgress'
import StatusSelect from '../ui/StatusSelect'

interface GoalCardProps {
  goal: Goal
  actions: GoalBoardActions
}

export default function GoalCard({ goal, actions }: GoalCardProps) {
  const savings = getSavingsSummary(goal)
  const targetLabel = getTargetLabel(goal)
  const CategoryIcon = goal.category ? CATEGORY_ICONS[goal.category] : null
  const isCompleted = goal.status === 'completed'

  return (
    <article className="relative rounded-2xl border border-sand-200 bg-white p-4 shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="flex items-start gap-2">
        {isCompleted && (
          <CircleCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-sage-600"
            aria-label="Completed"
          />
        )}
        <h3 className="font-semibold leading-snug text-ink-900">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => actions.onOpen(goal.id)}
            className="text-left after:absolute after:inset-0 after:rounded-2xl"
          >
            {goal.title}
          </button>
        </h3>
      </div>

      {goal.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-700">
          {goal.description}
        </p>
      )}

      {(goal.category || targetLabel || (isCompleted && goal.completedAt)) && (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700">
          {goal.category && CategoryIcon && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1">
              <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {goal.category}
            </li>
          )}
          {isCompleted && goal.completedAt ? (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Completed {formatTimestamp(goal.completedAt)}
            </li>
          ) : (
            targetLabel && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {targetLabel}
              </li>
            )
          )}
        </ul>
      )}

      {savings && (
        <SavingsProgress
          summary={savings}
          label={`Savings progress for ${goal.title}`}
          className="mt-4"
        />
      )}

      <StatusSelect
        className="relative z-10 mt-4"
        label={`Status of ${goal.title}`}
        hideLabel
        value={goal.status}
        disabled={actions.busyGoalIds.has(goal.id)}
        onChange={(status) => actions.onStatusChange(goal, status)}
      />
    </article>
  )
}