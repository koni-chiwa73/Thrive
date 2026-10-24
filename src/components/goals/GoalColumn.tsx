import { useId } from 'react'
import type { Goal, GoalBoardActions } from '../../types/goal'
import type { StatusConfig } from '../../utils/goalStatus'
import GoalCard from './GoalCard'

interface GoalColumnProps {
  config: StatusConfig
  goals: Goal[]
  actions: GoalBoardActions
  /** Controls visibility below the lg breakpoint (mobile/tablet). */
  className?: string
}

export default function GoalColumn({
  config,
  goals,
  actions,
  className = '',
}: GoalColumnProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-3xl bg-cream-100/70 p-3 sm:p-4 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`}
          aria-hidden="true"
        />
        <h2 id={headingId} className="font-semibold text-ink-900">
          {config.label}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-700">
          {goals.length}
        </span>
      </div>

      {goals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 px-4 py-8 text-center text-sm text-ink-500">
          {config.emptyMessage}
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} actions={actions} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}