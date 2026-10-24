import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import type { GoalStatus } from '../../types/goal'
import { STATUS_CONFIG } from '../../utils/goalStatus'

interface StatusSelectProps {
  value: GoalStatus
  onChange: (status: GoalStatus) => void
  label: string
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

export default function StatusSelect({
  value,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className = '',
}: StatusSelectProps) {
  const id = useId()

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1 block text-xs text-ink-500'}
      >
        {label}
      </label>
      <div className="relative w-44 max-w-full">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const next = STATUS_CONFIG.find(
              (config) => config.status === event.target.value,
            )
            if (next) onChange(next.status)
          }}
          className="w-full appearance-none rounded-full border border-sand-300 bg-white py-1.5 pl-3.5 pr-9 text-sm font-medium text-ink-900 transition-colors hover:border-sand-400 disabled:cursor-wait disabled:opacity-60"
        >
          {STATUS_CONFIG.map((config) => (
            <option key={config.status} value={config.status}>
              {config.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}