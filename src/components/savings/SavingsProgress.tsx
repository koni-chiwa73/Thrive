import { formatCurrency } from '../../utils/format'
import type { SavingsSummary } from '../../utils/savings'

interface SavingsProgressProps {
  summary: SavingsSummary
  /** Accessible name for the progress bar, e.g. "Savings progress for Sofa". */
  label: string
  /** Show the percentage next to the amounts (used in the details view). */
  showPercent?: boolean
  className?: string
}

export default function SavingsProgress({
  summary,
  label,
  showPercent = false,
  className = '',
}: SavingsProgressProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink-900">
          {formatCurrency(summary.saved)} saved of {formatCurrency(summary.target)}
        </p>
        {showPercent && (
          // Rounded down so "100%" only ever appears when the target is reached.
          <p className="text-sm tabular-nums text-ink-500">
            {Math.floor(Math.max(summary.percent, 0))}%
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(summary.barPercent)}
        className="mt-2 h-2 overflow-hidden rounded-full bg-sage-100"
      >
        <div
          className="h-full rounded-full bg-sage-600 transition-all"
          style={{ width: `${summary.barPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-500">
        {summary.reached
          ? "You've reached your target."
          : `${formatCurrency(summary.remaining)} to go`}
      </p>
    </div>
  )
}