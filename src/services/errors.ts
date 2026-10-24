/**
 * An error whose message is safe and useful to show to the user
 * (for example, "This would take your savings below zero.").
 * Any other error type gets a generic message in the UI.
 */
export class ServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ServiceError ? error.message : fallback
}