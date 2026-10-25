import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <h1 className="text-xl font-semibold text-ink-900">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-ink-700">
          Thrive ran into an unexpected problem. Your data is safe. Reloading
          the page usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sage-800"
        >
          Reload the page
        </button>
      </main>
    )
  }
}