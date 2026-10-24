import type { ReactNode } from 'react'

export interface ControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

interface FormFieldProps {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: (controlProps: ControlProps) => ReactNode
}

export default function FormField({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink-900"
      >
        {label}
        {optional && <span className="font-normal text-ink-500"> (optional)</span>}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-clay-600">
          {error}
        </p>
      )}
    </div>
  )
}