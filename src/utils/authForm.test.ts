import { describe, expect, it } from 'vitest'
import {
  validateEmail,
  validateNewPassword,
  validateResetPassword,
  validateSignIn,
  validateSignUp,
} from './authForm'

describe('validateEmail', () => {
  it.each(['', 'abc', 'a@b', 'a b@c.com'])('rejects %j', (email) => {
    expect(validateEmail(email)).toBeDefined()
  })

  it.each(['a@b.co', '  name@example.com  '])('accepts %j', (email) => {
    expect(validateEmail(email)).toBeUndefined()
  })
})

describe('validateNewPassword', () => {
  it('requires at least 8 characters', () => {
    expect(validateNewPassword('1234567')).toBeDefined()
    expect(validateNewPassword('12345678')).toBeUndefined()
  })

  it('allows at most 72 characters', () => {
    expect(validateNewPassword('x'.repeat(72))).toBeUndefined()
    expect(validateNewPassword('x'.repeat(73))).toBeDefined()
  })
})

describe('validateSignIn', () => {
  it('only requires something to be typed, so older accounts still work', () => {
    expect(validateSignIn('a@b.co', 'x')).toEqual({})
  })

  it('flags a missing password', () => {
    expect(validateSignIn('a@b.co', '').password).toBeDefined()
  })
})

describe('validateSignUp', () => {
  it('accepts matching, long-enough passwords', () => {
    expect(validateSignUp('a@b.co', 'longenough', 'longenough')).toEqual({})
  })

  it('flags mismatched passwords', () => {
    expect(validateSignUp('a@b.co', 'longenough', 'different1').confirmPassword).toBe(
      "The passwords don't match.",
    )
  })
})

describe('validateResetPassword', () => {
  it('checks length and confirmation', () => {
    expect(validateResetPassword('short', 'short').password).toBeDefined()
    expect(validateResetPassword('longenough', '').confirmPassword).toBeDefined()
    expect(validateResetPassword('longenough', 'longenough')).toEqual({})
  })
})