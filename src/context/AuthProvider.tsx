import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService } from '../services/authService'
import { AuthContext } from './authContext'
import type { AuthState } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<{ session: Session | null; isLoading: boolean }>({
    session: null,
    isLoading: true,
  })

  useEffect(() => {
    return authService.onAuthChange((session) => {
      setState({ session, isLoading: false })
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session: state.session,
      user: state.session?.user ?? null,
      isLoading: state.isLoading,
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}