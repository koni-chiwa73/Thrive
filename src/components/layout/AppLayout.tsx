import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGoals } from '../../hooks/useGoals'
import { useToast } from '../../hooks/useToast'
import { authService } from '../../services/authService'
import type { AppOutletContext } from '../../types/appContext'
import type {
  Goal,
  GoalDetailsActions,
  GoalInput,
  GoalStatus,
} from '../../types/goal'
import { getStatusLabel } from '../../utils/goalStatus'
import GoalDetailsModal from '../goals/GoalDetailsModal'
import GoalFormModal from '../goals/GoalFormModal'
import Toast from '../ui/Toast'
import Header from './Header'

type FormState = null | { mode: 'create' } | { mode: 'edit'; goalId: string }

export default function AppLayout() {
  const { user } = useAuth()
  const {
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
  } = useGoals()
  const { toast, showToast, dismissToast } = useToast()

  const [formState, setFormState] = useState<FormState>(null)
  const [detailsGoalId, setDetailsGoalId] = useState<string | null>(null)

  const detailsGoal = goals.find((goal) => goal.id === detailsGoalId) ?? null
  const editingGoal =
    formState?.mode === 'edit'
      ? (goals.find((goal) => goal.id === formState.goalId) ?? null)
      : null
  const isFormOpen =
    formState?.mode === 'create' ||
    (formState?.mode === 'edit' && editingGoal !== null)

  // After sign-out the route guard sends the user to the sign-in page.
  async function handleSignOut() {
    try {
      await authService.signOut()
    } catch {
      showToast('error', "We couldn't sign you out. Please try again.")
    }
  }

  // Errors are thrown on purpose: the form shows them inline.
  async function handleSaveGoal(input: GoalInput) {
    if (formState?.mode === 'edit') {
      const updated = await updateGoal(formState.goalId, input)
      showToast('success', `“${updated.title}” was updated.`)
    } else {
      const created = await createGoal(input)
      showToast('success', `“${created.title}” was added to To Do.`)
    }
    setFormState(null)
  }

  async function handleStatusChange(goal: Goal, status: GoalStatus) {
    if (goal.status === status) return
    try {
      await changeStatus(goal.id, status)
      showToast(
        'success',
        status === 'completed'
          ? `“${goal.title}” is marked as completed.`
          : `“${goal.title}” moved to ${getStatusLabel(status)}.`,
      )
    } catch {
      showToast('error', "We couldn't update that goal. Please try again.")
    }
  }

  // Errors are thrown on purpose: the confirm dialog shows them inline.
  async function handleDeleteGoal(goal: Goal) {
    await deleteGoal(goal.id)
    setDetailsGoalId(null)
    showToast('success', `“${goal.title}” was deleted.`)
  }

  // Each action throws on failure, so the form or dialog that called it
  // can show the error in place. Success feedback is shown here.
  const detailsActions: GoalDetailsActions = {
    addSavingsEntry: async (goalId, input) => {
      await addSavingsEntry(goalId, input)
      showToast('success', 'Savings entry added.')
    },
    updateSavingsEntry: async (goalId, entryId, input) => {
      await updateSavingsEntry(goalId, entryId, input)
      showToast('success', 'Savings entry updated.')
    },
    deleteSavingsEntry: async (goalId, entryId) => {
      await deleteSavingsEntry(goalId, entryId)
      showToast('success', 'Savings entry deleted.')
    },
    addLink: async (goalId, input) => {
      await addLink(goalId, input)
      showToast('success', 'Link added.')
    },
    updateLink: async (goalId, linkId, input) => {
      await updateLink(goalId, linkId, input)
      showToast('success', 'Link updated.')
    },
    deleteLink: async (goalId, linkId) => {
      await deleteLink(goalId, linkId)
      showToast('success', 'Link deleted.')
    },
  }

  const outletContext: AppOutletContext = {
    goals,
    isLoading,
    loadError: error,
    busyGoalIds,
    onRetry: reload,
    onOpenGoal: setDetailsGoalId,
    onStatusChange: handleStatusChange,
  }

  return (
    <div className="min-h-screen">
      <Header
        userEmail={user?.email ?? ''}
        onAddGoal={() => setFormState({ mode: 'create' })}
        onSignOut={handleSignOut}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet context={outletContext} />
      </main>

      {/* The details view hides while the edit form is open, then returns. */}
      <GoalDetailsModal
        open={detailsGoal !== null && formState === null}
        goal={detailsGoal}
        isStatusBusy={detailsGoal ? busyGoalIds.has(detailsGoal.id) : false}
        actions={detailsActions}
        onClose={() => setDetailsGoalId(null)}
        onEdit={() =>
          detailsGoal && setFormState({ mode: 'edit', goalId: detailsGoal.id })
        }
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteGoal}
      />

      <GoalFormModal
        open={isFormOpen}
        goal={editingGoal}
        onClose={() => setFormState(null)}
        onSubmit={handleSaveGoal}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  )
}