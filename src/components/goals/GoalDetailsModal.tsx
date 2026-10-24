import { Pencil, Trash2 } from 'lucide-react'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import type { Goal, GoalDetailsActions, GoalStatus } from '../../types/goal'
import { formatTimestamp } from '../../utils/format'
import { getTargetLabel } from '../../utils/goalDisplay'
import { getSavingsSummary } from '../../utils/savings'
import LinksSection from '../links/LinksSection'
import SavingsSection from '../savings/SavingsSection'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import StatusSelect from '../ui/StatusSelect'

interface GoalDetailsModalProps {
  open: boolean
  goal: Goal | null
  isStatusBusy: boolean
  actions: GoalDetailsActions
  onClose: () => void
  onEdit: () => void
  onStatusChange: (goal: Goal, status: GoalStatus) => void
  onDelete: (goal: Goal) => Promise<void>
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value}</dd>
    </div>
  )
}

export default function GoalDetailsModal({
  open,
  goal,
  isStatusBusy,
  actions,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: GoalDetailsModalProps) {
  const deletion = useConfirmAction<Goal>(
    onDelete,
    "We couldn't delete this goal. Please try again.",
  )

  const savings = goal ? getSavingsSummary(goal) : null

  return (
    <>
      <Modal
        open={open && goal !== null}
        onClose={onClose}
        title={goal?.title ?? ''}
        size="lg"
      >
        {goal && (
          <div className="space-y-6">
            <p
              className={`whitespace-pre-line text-sm ${
                goal.description ? 'text-ink-700' : 'text-ink-500'
              }`}
            >
              {goal.description ?? 'No description added.'}
            </p>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-900">Overview</h3>
              <StatusSelect
                label="Status"
                value={goal.status}
                disabled={isStatusBusy}
                onChange={(status) => onStatusChange(goal, status)}
              />
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Category" value={goal.category ?? 'None'} />
                <DetailItem
                  label="Target"
                  value={getTargetLabel(goal) ?? 'No deadline'}
                />
                <DetailItem
                  label="Created"
                  value={formatTimestamp(goal.createdAt)}
                />
                {goal.status === 'completed' && goal.completedAt && (
                  <DetailItem
                    label="Completed"
                    value={formatTimestamp(goal.completedAt)}
                  />
                )}
              </dl>
            </section>

            {savings && (
              <SavingsSection goal={goal} summary={savings} actions={actions} />
            )}

            <LinksSection goal={goal} actions={actions} />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-4">
              <Button
                variant="subtleDanger"
                onClick={() => deletion.request(goal)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
              <Button variant="secondary" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deletion.pending !== null}
        title="Delete this goal?"
        message={`This will permanently delete “${deletion.pending?.title ?? ''}” along with its savings entries and links. This can't be undone.`}
        confirmLabel="Delete goal"
        busyLabel="Deleting…"
        isBusy={deletion.isBusy}
        error={deletion.error}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </>
  )
}