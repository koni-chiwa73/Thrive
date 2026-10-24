import { Link, Navigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import FullPageLoader from '../components/ui/FullPageLoader'
import { useAuth } from '../hooks/useAuth'

const linkClasses = 'font-medium text-sage-700 underline-offset-2 hover:underline'

export default function AuthCallbackPage() {
  const { session, isLoading } = useAuth()

  // supabase-js exchanges the one-time code in the URL for a session while it
  // starts up. Once it has finished, either a session exists or it failed.
  if (isLoading) return <FullPageLoader label="Signing you in…" />
  if (session) return <Navigate to="/" replace />

  return (
    <AuthLayout
      title="We couldn't complete that"
      footer={
        <Link to="/sign-in" className={linkClasses}>
          Go to sign in
        </Link>
      }
    >
      <div role="alert" className="space-y-3 text-sm text-ink-700">
        <p>
          The link may have expired, or it was opened in a different browser
          than the one you started in, or sign-in was cancelled.
        </p>
        <p>
          If you've just confirmed your email, you can simply sign in now.
        </p>
      </div>
    </AuthLayout>
  )
}