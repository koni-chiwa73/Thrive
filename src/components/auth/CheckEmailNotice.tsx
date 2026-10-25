import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../services/errors'
import Button from '../ui/Button'
import AuthLayout from './AuthLayout'

const COOLDOWN_SECONDS = 60

interface CheckEmailNoticeProps {
  email: string
}

interface Feedback {
  kind: 'success' | 'error'
  text: string
}

export default function CheckEmailNotice({ email }: CheckEmailNoticeProps) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS)
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  async function handleResend() {
    if (isSending || secondsLeft > 0) return
    setIsSending(true)
    setFeedback(null)
    try {
      await authService.resendConfirmation(email)
      setFeedback({ kind: 'success', text: 'We sent another email.' })
      setSecondsLeft(COOLDOWN_SECONDS)
    } catch (caught) {
      setFeedback({
        kind: 'error',
        text: getErrorMessage(caught, "We couldn't send the email. Please try again."),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AuthLayout
      title="Check your email"
      footer={
        <Link
          to="/sign-in"
          className="font-medium text-sage-700 underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4 text-sm text-ink-700">
        <p role="status">
          We've sent a confirmation link to{' '}
          <span className="break-all font-medium text-ink-900">{email}</span>.
          Open it to finish creating your account.
        </p>
        <p>
          It can take a minute, and it may land in your spam folder. If you
          already have an account with this email, you can sign in instead.
        </p>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          disabled={isSending || secondsLeft > 0}
        >
          {isSending
            ? 'Sending…'
            : secondsLeft > 0
              ? `Resend email in ${secondsLeft}s`
              : 'Resend email'}
        </Button>

        {feedback && (
          <p
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            className={feedback.kind === 'error' ? 'text-clay-600' : 'text-sage-700'}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </AuthLayout>
  )
}