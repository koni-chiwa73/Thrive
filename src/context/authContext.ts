import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthState {
  session: Session | null
  user: User | null
  /** True until Supabase has finished checking for an existing session. */
  isLoading: boolean
}

export const AuthContext = createContext<AuthState | null>(null)