import type { AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ServiceError } from './errors'

function appUrl(path: string): string {
  return `${window.location.origin}${path}`
}

/**
 * Known failures become friendly ServiceErrors. Anything else is logged
 * and returned as-is, and the UI shows a generic message for it.
 */
function toFriendlyError(error: AuthError): Error {
  switch (error.code) {
    case 'invalid_credentials':
      return new ServiceError("That email and password don't match.")
    case 'email_not_confirmed':
      return new ServiceError(
        'Please confirm your email first. Check your inbox for the confirmation link.',
      )
    case 'weak_password':
      return new ServiceError('Choose a stronger password of at least 8 characters.')
    case 'same_password':
      return new ServiceError('Choose a password that is different from your current one.')
    case 'email_address_invalid':
      return new ServiceError("That email address can't be used. Check it and try again.")
    case 'signup_disabled':
      return new ServiceError('Creating new accounts is turned off right now.')
    case 'over_email_send_rate_limit':
      return new ServiceError(
        'Too many emails have been requested. Please wait a while and try again.',
      )
    case 'over_request_rate_limit':
      return new ServiceError('Too many attempts. Please wait a moment and try again.')
    default:
      console.error('[authService]', error)
      return error
  }
}

export const authService = {
  /**
   * Calls back with the current session as soon as it is known, then again
   * whenever the user signs in or out or the token refreshes.
   * Returns an unsubscribe function.
   */
  onAuthChange(callback: (session: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return () => data.subscription.unsubscribe()
  },

  /** With email confirmation on, no session exists until the link is opened. */
  async signUp(
    email: string,
    password: string,
  ): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: appUrl('/auth/callback') },
    })
    if (error) throw toFriendlyError(error)
    return { needsConfirmation: data.session === null }
  },

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw toFriendlyError(error)
  },

  /** On success the browser leaves for Google, so this never "returns" visibly. */
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: appUrl('/auth/callback') },
    })
    if (error) throw toFriendlyError(error)
  },

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('/reset-password'),
    })
    if (error) throw toFriendlyError(error)
  },

  /** Works for the temporary session created by a reset link, or a normal one. */
  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw toFriendlyError(error)
  },

 /** Sends the sign-up confirmation email again. */
  async resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: appUrl('/auth/callback') },
    })
    if (error) throw toFriendlyError(error)
  },

  /** Ends the session on this device only. */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
  },
}