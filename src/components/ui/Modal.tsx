import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: ModalSize
  children: ReactNode
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pointerDownOnBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Children mount before showModal(), so focus the preferred control now.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        // If `open` is still true, the user closed it (e.g. Escape).
        // If it is false, we closed it programmatically: nothing to report.
        if (open) onClose()
      }}
      onMouseDown={(event) => {
        pointerDownOnBackdrop.current = event.target === dialogRef.current
      }}
      onClick={(event) => {
        if (pointerDownOnBackdrop.current && event.target === dialogRef.current) {
          onClose()
        }
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${SIZE_CLASSES[size]} overflow-y-auto rounded-3xl border border-sand-200 bg-cream-50 p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/40`}
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold leading-snug">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 -mt-1 rounded-full p-1.5 text-ink-500 transition-colors hover:bg-cream-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}