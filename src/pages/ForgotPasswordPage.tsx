import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { controlClasses } from '../components/ui/styles'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/errors'
import { validateForgotPassword } from '../utils/authForm'

const linkClasses = 'font-medium text-sage-700 underline-offset-2 hover:underline'

export default function ForgotPasswordPage() {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const found = validateForgotPassword(email).email
    setError(found)
    setSubmitError(null)
    if (found) {
      document.getElementById(emailId)?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const trimmed = email.trim()
      await authService.requestPasswordReset(trimmed)
      setSentTo(trimmed)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't send the email. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const footer = (
    <Link to="/sign-in" className={linkClasses}>
      Back to sign in
    </Link>
  )

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" footer={footer}>
        <div role="status" className="space-y-3 text-sm text-ink-700">
          <p>
            If an account exists for{' '}
            <span className="break-all font-medium text-ink-900">{sentTo}</span>,
            we've sent a link to reset its password.
          </p>
          <p>It can take a minute, and it may land in your spam folder.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id={emailId} label="Email" error={error}>
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(undefined)
              }}
              className={controlClasses(Boolean(error))}
            />
          )}
        </FormField>

        {submitError && (
          <p role="alert" className="text-sm text-clay-600">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  )
}