import { useEffect, useRef } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import type { ToastState } from '../../hooks/useToast'

interface ToastProps {
  toast: ToastState | null
  onDismiss: () => void
}

/**
 * Uses the Popover API so the toast renders in the browser's top layer.
 * Native <dialog> modals also live there, so a normal fixed element
 * would be hidden behind an open modal.
 */
export default function Toast({ toast, onDismiss }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const isShown = element.matches(':popover-open')
    if (toast) {
      // Re-show so a new toast always sits above any modal opened meanwhile.
      if (isShown) element.hidePopover()
      element.showPopover()
    } else if (isShown) {
      element.hidePopover()
    }
  }, [toast])

  const isError = toast?.kind === 'error'

  return (
    <div
      ref={ref}
      popover="manual"
      className="inset-auto bottom-4 left-1/2 m-0 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-visible border-0 bg-transparent p-0"
    >
      {toast && (
        <div
          role={isError ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm shadow-lg ${
            isError ? 'border-clay-600/40' : 'border-sage-200'
          }`}
        >
          {isError ? (
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-clay-600"
              aria-hidden="true"
            />
          ) : (
            <CircleCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-sage-600"
              aria-hidden="true"
            />
          )}
          <p className="flex-1 text-ink-900">{toast.message}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="-mr-1 -mt-1 rounded-full p-1 text-ink-500 hover:bg-cream-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}