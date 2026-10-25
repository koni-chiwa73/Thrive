import { Link } from 'react-router-dom'
import { Plus, Sprout } from 'lucide-react'
import Button from '../ui/Button'
import AccountMenu from './AccountMenu'

interface HeaderProps {
  userEmail: string
  onAddGoal: () => void
  onSignOut: () => void
}

export default function Header({ userEmail, onAddGoal, onSignOut }: HeaderProps) {
  return (
    <>
      {/* First focusable element: lets keyboard users skip the header. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sage-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-sand-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            aria-label="Thrive, go to dashboard"
            className="flex items-center gap-2 rounded-full"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-sage-800">
              Thrive
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button onClick={onAddGoal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Goal
            </Button>
            <AccountMenu email={userEmail} onSignOut={onSignOut} />
          </div>
        </div>
      </header>
    </>
  )
}