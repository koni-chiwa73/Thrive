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
import { AUTH_FIELD_ORDER, validateSignIn } from '../utils/authForm'
import type { AuthErrors, AuthField } from '../utils/authForm'

const linkClasses = 'font-medium text-sage-700 underline-offset-2 hover:underline'

export default function SignInPage() {
  const idPrefix = useId()
  const fieldId = (field: AuthField) => `${idPrefix}-${field}`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<AuthErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleBusy, setIsGoogleBusy] = useState(false)
  const isBusy = isSubmitting || isGoogleBusy

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return

    const found = validateSignIn(email, password)
    setErrors(found)
    setSubmitError(null)

    const firstInvalid = AUTH_FIELD_ORDER.find((field) => found[field])
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      // On success the session changes and the router moves us to the dashboard.
      await authService.signInWithPassword(email.trim(), password)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't sign you in. Please try again."),
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

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your goals."
      footer={
        <>
          New to Thrive?{' '}
          <Link to="/sign-up" className={linkClasses}>
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton
        label="Continue with Google"
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
                setErrors((previous) => ({ ...previous, email: undefined }))
              }}
              className={controlClasses(Boolean(errors.email))}
            />
          )}
        </FormField>

        <div>
          <FormField id={fieldId('password')} label="Password" error={errors.password}>
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErrors((previous) => ({ ...previous, password: undefined }))
                }}
                className={controlClasses(Boolean(errors.password))}
              />
            )}
          </FormField>
          <p className="mt-2 text-right text-sm">
            <Link to="/forgot-password" className={linkClasses}>
              Forgot your password?
            </Link>
          </p>
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-clay-600">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isBusy}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}