import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtleDanger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-sage-700 text-white shadow-sm hover:bg-sage-800',
  secondary:
    'border border-sand-300 bg-white text-ink-900 hover:bg-cream-100',
  ghost: 'text-ink-700 hover:bg-cream-100',
  danger: 'bg-clay-600 text-white shadow-sm hover:bg-clay-700',
  subtleDanger:
    'border border-clay-600/40 bg-white text-clay-600 hover:bg-clay-50',
}

export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}