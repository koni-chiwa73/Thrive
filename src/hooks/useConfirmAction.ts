import { useState } from 'react'
import { getErrorMessage } from '../services/errors'

/**
 * State for a "confirm, then do something destructive" dialog.
 * `pending` is the item awaiting confirmation (null = dialog closed).
 * Failures stay inside the dialog so the user can retry or cancel.
 */
export function useConfirmAction<T>(
  action: (item: T) => Promise<void>,
  fallbackError: string,
) {
  const [pending, setPending] = useState<T | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function request(item: T) {
    setError(null)
    setPending(item)
  }

  function cancel() {
    if (isBusy) return
    setPending(null)
    setError(null)
  }

  async function confirm() {
    if (pending === null || isBusy) return
    setIsBusy(true)
    setError(null)
    try {
      await action(pending)
      setPending(null)
    } catch (caught) {
      setError(getErrorMessage(caught, fallbackError))
    } finally {
      setIsBusy(false)
    }
  }

  return { pending, isBusy, error, request, cancel, confirm }
}