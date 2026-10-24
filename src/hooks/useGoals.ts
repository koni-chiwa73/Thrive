import { useCallback, useEffect, useMemo, useState } from 'react'
import { goalService } from '../services/goalService'
import type {
  Goal,
  GoalInput,
  GoalLinkInput,
  GoalStatus,
  SavingsEntryInput,
} from '../types/goal'

/** Completed goals sort by completion date, others by creation date. Newest first. */
function sortGoals(goals: Goal[]): Goal[] {
  const sortKey = (goal: Goal) =>
    Date.parse(
      goal.status === 'completed' && goal.completedAt
        ? goal.completedAt
        : goal.createdAt,
    )
  return [...goals].sort((a, b) => sortKey(b) - sortKey(a))
}

export function useGoals() {
  const [rawGoals, setRawGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyGoalIds, setBusyGoalIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  useEffect(() => {
    let ignore = false
    goalService.listGoals().then(
      (loaded) => {
        if (ignore) return
        setRawGoals(loaded)
        setError(null)
        setIsLoading(false)
      },
      () => {
        if (ignore) return
        setError("We couldn't load your goals. Please try again.")
        setIsLoading(false)
      },
    )
    return () => {
      ignore = true
    }
  }, [reloadKey])

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }, [])

  const setBusy = useCallback((id: string, busy: boolean) => {
    setBusyGoalIds((previous) => {
      const next = new Set(previous)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const replaceGoal = useCallback((updated: Goal) => {
    setRawGoals((previous) =>
      previous.map((goal) => (goal.id === updated.id ? updated : goal)),
    )
  }, [])

  // The mutations below let errors propagate so the caller can show feedback
  // in the right place (inline in a form, or as a toast).

  const createGoal = useCallback(async (input: GoalInput) => {
    const created = await goalService.createGoal(input)
    setRawGoals((previous) => [created, ...previous])
    return created
  }, [])

  const updateGoal = useCallback(
    async (id: string, input: GoalInput) => {
      const updated = await goalService.updateGoal(id, input)
      replaceGoal(updated)
      return updated
    },
    [replaceGoal],
  )

  const changeStatus = useCallback(
    async (id: string, status: GoalStatus) => {
      setBusy(id, true)
      try {
        const updated = await goalService.updateGoalStatus(id, status)
        replaceGoal(updated)
        return updated
      } finally {
        setBusy(id, false)
      }
    },
    [replaceGoal, setBusy],
  )

  const deleteGoal = useCallback(async (id: string) => {
    await goalService.deleteGoal(id)
    setRawGoals((previous) => previous.filter((goal) => goal.id !== id))
  }, [])

  // Savings entries and links: the service returns the updated goal, and
  // totals are recalculated from its entries wherever they are displayed.

  const addSavingsEntry = useCallback(
    async (goalId: string, input: SavingsEntryInput) => {
      replaceGoal(await goalService.addSavingsEntry(goalId, input))
    },
    [replaceGoal],
  )

  const updateSavingsEntry = useCallback(
    async (goalId: string, entryId: string, input: SavingsEntryInput) => {
      replaceGoal(await goalService.updateSavingsEntry(goalId, entryId, input))
    },
    [replaceGoal],
  )

  const deleteSavingsEntry = useCallback(
    async (goalId: string, entryId: string) => {
      replaceGoal(await goalService.deleteSavingsEntry(goalId, entryId))
    },
    [replaceGoal],
  )

  const addLink = useCallback(
    async (goalId: string, input: GoalLinkInput) => {
      replaceGoal(await goalService.addLink(goalId, input))
    },
    [replaceGoal],
  )

  const updateLink = useCallback(
    async (goalId: string, linkId: string, input: GoalLinkInput) => {
      replaceGoal(await goalService.updateLink(goalId, linkId, input))
    },
    [replaceGoal],
  )

  const deleteLink = useCallback(
    async (goalId: string, linkId: string) => {
      replaceGoal(await goalService.deleteLink(goalId, linkId))
    },
    [replaceGoal],
  )

  const goals = useMemo(() => sortGoals(rawGoals), [rawGoals])

  return {
    goals,
    isLoading,
    error,
    busyGoalIds,
    reload,
    createGoal,
    updateGoal,
    changeStatus,
    deleteGoal,
    addSavingsEntry,
    updateSavingsEntry,
    deleteSavingsEntry,
    addLink,
    updateLink,
    deleteLink,
  }
}