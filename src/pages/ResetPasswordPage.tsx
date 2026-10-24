import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import FullPageLoader from '../components/ui/FullPageLoader'
import { controlClasses } from '../components/ui/styles'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/errors'
import {
  AUTH_FIELD_ORDER,
  PASSWORD_MIN_LENGTH,
  validateResetPassword,
} from '../utils/authForm'
import type { AuthErrors, AuthField } from '../utils/authForm'

const linkClasses = 'font-medium text-sage-700 underline-offset-2 hover:underline'

/**
 * Opened from the link in the reset email. Supabase turns that link into a
 * temporary session, so "no session" means the link was invalid, expired,
 * or already used.
 */
export default function ResetPasswordPage() {
  const { session, isLoading } = useAuth()
  const idPrefix = useId()
  const fieldId = (field: AuthField) => `${idPrefix}-${field}`

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<AuthErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const found = validateResetPassword(password, confirmPassword)
    setErrors(found)
    setSubmitError(null)

    const firstInvalid = AUTH_FIELD_ORDER.find((field) => found[field])
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await authService.updatePassword(password)
      setIsDone(true)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't update your password. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <FullPageLoader />

  if (isDone) {
    return (
      <AuthLayout title="Password updated">
        <div role="status" className="space-y-5 text-sm text-ink-700">
          <p>Your password has been changed. You're signed in.</p>
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sage-800"
          >
            Go to my goals
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (!session) {
    return (
      <AuthLayout
        title="This link isn't valid"
        footer={
          <Link to="/sign-in" className={linkClasses}>
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-3 text-sm text-ink-700">
          <p>The reset link may have expired or already been used.</p>
          <p>
            <Link to="/forgot-password" className={linkClasses}>
              Request a new link
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id={fieldId('password')}
          label="New password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={errors.password}
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((previous) => ({ ...previous, password: undefined }))
              }}
              className={controlClasses(Boolean(errors.password))}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('confirmPassword')}
          label="Confirm new password"
          error={errors.confirmPassword}
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setErrors((previous) => ({ ...previous, confirmPassword: undefined }))
              }}
              className={controlClasses(Boolean(errors.confirmPassword))}
            />
          )}
        </FormField>

        {submitError && (
          <p role="alert" className="text-sm text-clay-600">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  )
}