import { Loader2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import GoalBoard from '../components/goals/GoalBoard'
import Button from '../components/ui/Button'
import type { AppOutletContext } from '../types/appContext'

export default function DashboardPage() {
  const {
    goals,
    isLoading,
    loadError,
    busyGoalIds,
    onRetry,
    onOpenGoal,
    onStatusChange,
  } = useOutletContext<AppOutletContext>()

  const activeCount = goals.filter((goal) => goal.status !== 'completed').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Your goals, one step at a time.
        </h1>
        <p className="mt-2 text-ink-700">
          Keep track of what matters to you and celebrate your progress.
        </p>
        {!isLoading && !loadError && (
          <p className="mt-3 text-sm text-ink-500">
            {activeCount === 1 ? '1 active goal' : `${activeCount} active goals`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 rounded-3xl bg-cream-100/70 py-16 text-ink-700"
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading your goals…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-3xl bg-cream-100/70 px-4 py-16 text-center"
        >
          <p className="text-ink-900">{loadError}</p>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <GoalBoard
          goals={goals}
          actions={{ onOpen: onOpenGoal, onStatusChange, busyGoalIds }}
        />
      )}
    </div>
  )
}