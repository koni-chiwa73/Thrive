import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need an accessible name. */
  label: string
  icon: LucideIcon
  tone?: 'default' | 'danger'
}

const TONE_CLASSES = {
  default: 'text-ink-500 hover:bg-cream-100 hover:text-ink-900',
  danger: 'text-ink-500 hover:bg-clay-50 hover:text-clay-600',
}

export default function IconButton({
  label,
  icon: Icon,
  tone = 'default',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}