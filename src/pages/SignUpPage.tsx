import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import GoogleButton from '../components/auth/GoogleButton'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { controlClasses } from '../components/ui/styles'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/errors'
import {
  AUTH_FIELD_ORDER,
  PASSWORD_MIN_LENGTH,
  validateSignUp,
} from '../utils/authForm'
import type { AuthErrors, AuthField } from '../utils/authForm'

const linkClasses = 'font-medium text-sage-700 underline-offset-2 hover:underline'

export default function SignUpPage() {
  const idPrefix = useId()
  const fieldId = (field: AuthField) => `${idPrefix}-${field}`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<AuthErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleBusy, setIsGoogleBusy] = useState(false)
  /** Set once the confirmation email has been requested. */
  const [sentTo, setSentTo] = useState<string | null>(null)
  const isBusy = isSubmitting || isGoogleBusy

  function clearError(field: AuthField) {
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return

    const found = validateSignUp(email, password, confirmPassword)
    setErrors(found)
    setSubmitError(null)

    const firstInvalid = AUTH_FIELD_ORDER.find((field) => found[field])
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const trimmed = email.trim()
      const { needsConfirmation } = await authService.signUp(trimmed, password)
      // If confirmation is switched off in Supabase, a session now exists and
      // the router moves us to the dashboard on its own.
      if (needsConfirmation) setSentTo(trimmed)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't create your account. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogle() {
    if (isBusy) return
    setSubmitError(null)
    setIsGoogleBusy(true)
    try {
      await authService.signInWithGoogle() // leaves the page on success
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't start Google sign-in. Please try again."),
      )
      setIsGoogleBusy(false)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        footer={
          <Link to="/sign-in" className={linkClasses}>
            Back to sign in
          </Link>
        }
      >
        <div role="status" className="space-y-3 text-sm text-ink-700">
          <p>
            We've sent a confirmation link to{' '}
            <span className="break-all font-medium text-ink-900">{sentTo}</span>.
            Open it to finish creating your account.
          </p>
          <p>
            It can take a minute, and it may land in your spam folder. If you
            already have an account with this email, you can sign in instead.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="A calm place for the things you want to achieve."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className={linkClasses}>
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton
        label="Sign up with Google"
        isBusy={isGoogleBusy}
        disabled={isBusy}
        onClick={handleGoogle}
      />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500" aria-hidden="true">
        <span className="h-px flex-1 bg-sand-200" />
        or
        <span className="h-px flex-1 bg-sand-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id={fieldId('email')} label="Email" error={errors.email}>
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                clearError('email')
              }}
              className={controlClasses(Boolean(errors.email))}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('password')}
          label="Password"
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
                clearError('password')
              }}
              className={controlClasses(Boolean(errors.password))}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('confirmPassword')}
          label="Confirm password"
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
                clearError('confirmPassword')
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

        <Button type="submit" className="w-full" disabled={isBusy}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}