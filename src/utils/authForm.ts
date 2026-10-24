export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export type AuthField = 'email' | 'password' | 'confirmPassword'
export type AuthErrors = Partial<Record<AuthField, string>>

/** Top-to-bottom order of fields, used to focus the first invalid one. */
export const AUTH_FIELD_ORDER: AuthField[] = ['email', 'password', 'confirmPassword']

export function validateEmail(raw: string): string | undefined {
  const email = raw.trim()
  if (email === '') return 'Enter your email address.'
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address, such as name@example.com.'
  }
  return undefined
}

export function validateNewPassword(password: string): string | undefined {
  if (password === '') return 'Choose a password.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`
  }
  return undefined
}

function validateConfirmation(password: string, confirm: string): string | undefined {
  if (confirm === '') return 'Type your password again to confirm it.'
  if (confirm !== password) return "The passwords don't match."
  return undefined
}

function collect(entries: [AuthField, string | undefined][]): AuthErrors {
  const errors: AuthErrors = {}
  for (const [field, message] of entries) {
    if (message) errors[field] = message
  }
  return errors
}

/** Sign-in only requires something to be typed, so existing accounts still work. */
export function validateSignIn(email: string, password: string): AuthErrors {
  return collect([
    ['email', validateEmail(email)],
    ['password', password === '' ? 'Enter your password.' : undefined],
  ])
}

export function validateSignUp(
  email: string,
  password: string,
  confirm: string,
): AuthErrors {
  return collect([
    ['email', validateEmail(email)],
    ['password', validateNewPassword(password)],
    ['confirmPassword', validateConfirmation(password, confirm)],
  ])
}

export function validateForgotPassword(email: string): AuthErrors {
  return collect([['email', validateEmail(email)]])
}

export function validateResetPassword(password: string, confirm: string): AuthErrors {
  return collect([
    ['password', validateNewPassword(password)],
    ['confirmPassword', validateConfirmation(password, confirm)],
  ])
}