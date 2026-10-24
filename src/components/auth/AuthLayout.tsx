import type { ReactNode } from 'react'
import { Sprout } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Small line under the card, e.g. "New here? Create an account". */
  footer?: ReactNode
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-100 text-sage-700">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-sage-800">
            Thrive
          </span>
        </div>

        <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-700">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <p className="mt-6 text-center text-sm text-ink-700">{footer}</p>}
      </div>
    </main>
  )
}