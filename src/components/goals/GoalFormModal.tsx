import type { Goal, GoalInput } from '../../types/goal'
import Modal from '../ui/Modal'
import GoalForm from './GoalForm'

interface GoalFormModalProps {
  open: boolean
  /** The goal being edited, or null when creating a new one. */
  goal: Goal | null
  onClose: () => void
  onSubmit: (input: GoalInput) => Promise<void>
}

export default function GoalFormModal({
  open,
  goal,
  onClose,
  onSubmit,
}: GoalFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'Add a goal'}>
      <GoalForm goal={goal} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  )
}