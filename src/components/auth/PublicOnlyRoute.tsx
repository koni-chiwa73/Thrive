import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import FullPageLoader from '../ui/FullPageLoader'

/** Sign-in and sign-up pages: signed-in users are sent to the dashboard. */
export default function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) return <FullPageLoader />
  if (session) return <Navigate to="/" replace />

  return <Outlet />
}