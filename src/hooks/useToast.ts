import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastKind = 'success' | 'error'

export interface ToastState {
  id: number
  kind: ToastKind
  message: string
}

const TOAST_DURATION_MS = 5000

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismissToast = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((kind: ToastKind, message: string) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), kind, message })
    timer.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { toast, showToast, dismissToast }
}