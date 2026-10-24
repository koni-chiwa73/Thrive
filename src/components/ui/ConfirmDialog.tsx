import Button from './Button'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  busyLabel: string
  isBusy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busyLabel,
  isBusy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-ink-700">{message}</p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-clay-600">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        {/* Cancel gets initial focus: the safe choice for a destructive prompt. */}
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isBusy}
          data-autofocus
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isBusy}>
          {isBusy ? busyLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}