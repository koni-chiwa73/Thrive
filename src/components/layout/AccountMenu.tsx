import { useEffect, useId, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import Button from '../ui/Button'

interface AccountMenuProps {
  email: string
  onSignOut: () => void
}

/** A disclosure button: simple, keyboard friendly, closes on Escape or outside click. */
export default function AccountMenu({ email, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const initial = email.trim().charAt(0).toUpperCase() || '?'

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Account menu"
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 bg-white text-sm font-semibold text-sage-800 transition-colors hover:bg-cream-100"
      >
        {initial}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-sand-200 bg-white p-3 shadow-lg"
        >
          <p className="px-2 text-xs text-ink-500">Signed in as</p>
          <p className="mb-3 break-all px-2 text-sm font-medium text-ink-900">
            {email}
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  )
}