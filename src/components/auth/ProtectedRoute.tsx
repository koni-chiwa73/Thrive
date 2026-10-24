import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import FullPageLoader from '../ui/FullPageLoader'

/** Renders the nested routes only for signed-in users. */
export default function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) return <FullPageLoader />
  if (!session) return <Navigate to="/sign-in" replace />

  // Keyed by user id: switching accounts always remounts everything below,
  // so one user's data can never linger in memory for the next.
  return <Outlet key={session.user.id} />
}