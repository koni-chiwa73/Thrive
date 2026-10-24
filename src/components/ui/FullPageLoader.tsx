import { Loader2 } from 'lucide-react'

interface FullPageLoaderProps {
  label?: string
}

export default function FullPageLoader({ label = 'Loading…' }: FullPageLoaderProps) {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center gap-3 text-ink-700"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}