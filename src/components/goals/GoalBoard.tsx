import { useState } from 'react'
import type { Goal, GoalBoardActions, GoalStatus } from '../../types/goal'
import { STATUS_CONFIG } from '../../utils/goalStatus'
import GoalColumn from './GoalColumn'

interface GoalBoardProps {
  goals: Goal[]
  actions: GoalBoardActions
}

export default function GoalBoard({ goals, actions }: GoalBoardProps) {
  // Only used below the lg breakpoint, where one column is shown at a time.
  const [activeStatus, setActiveStatus] = useState<GoalStatus>('todo')

  const countFor = (status: GoalStatus) =>
    goals.filter((goal) => goal.status === status).length

  return (
    <div>
      {/* Status switcher: mobile and tablet only */}
      <nav
        aria-label="Goal status"
        className="mb-4 flex gap-1 rounded-full bg-cream-100 p-1 lg:hidden"
      >
        {STATUS_CONFIG.map(({ status, label }) => {
          const isActive = status === activeStatus
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveStatus(status)}
              className={`flex-1 rounded-full px-2 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              {label} ({countFor(status)})
            </button>
          )
        })}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {STATUS_CONFIG.map((config) => (
          <GoalColumn
            key={config.status}
            config={config}
            goals={goals.filter((goal) => goal.status === config.status)}
            actions={actions}
            className={
              config.status === activeStatus ? 'block' : 'hidden lg:block'
            }
          />
        ))}
      </div>
    </div>
  )
}