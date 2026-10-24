import type { SavingsEntry, SavingsEntryInput } from '../types/goal'
import { isValidDateOnly, todayISO } from './dates'
import { formatCurrency } from './format'
import { MAX_ENTRY_AMOUNT, getBalanceCents } from './savings'

export type EntryKind = 'deposit' | 'withdrawal'

/** Raw form state: everything is a string, exactly as the inputs hold it. */
export interface SavingsFormValues {
  kind: EntryKind
  /** Always typed as a positive number. The kind decides the sign. */
  amount: string
  /** YYYY-MM-DD */
  entryDate: string
  note: string
}

export type SavingsFormField = 'amount' | 'entryDate' | 'note'
export type SavingsFormErrors = Partial<Record<SavingsFormField, string>>

export const SAVINGS_FIELD_ORDER: SavingsFormField[] = [
  'amount',
  'entryDate',
  'note',
]

/** Which error to clear when a given form value changes. */
export const SAVINGS_VALUE_TO_FIELD: Record<
  keyof SavingsFormValues,
  SavingsFormField
> = {
  kind: 'amount',
  amount: 'amount',
  entryDate: 'entryDate',
  note: 'note',
}

export const NOTE_MAX_LENGTH = 200

export function createEmptySavingsValues(): SavingsFormValues {
  return { kind: 'deposit', amount: '', entryDate: todayISO(), note: '' }
}

export function entryToFormValues(entry: SavingsEntry): SavingsFormValues {
  return {
    kind: entry.amount < 0 ? 'withdrawal' : 'deposit',
    amount: String(Math.abs(entry.amount)),
    entryDate: entry.entryDate,
    note: entry.note ?? '',
  }
}

export interface SavingsValidationResult {
  errors: SavingsFormErrors
  /** Null when there is at least one error. */
  input: SavingsEntryInput | null
}

/**
 * @param entries   The goal's current entries (used for the balance check).
 * @param editingId The entry being edited, or null when adding a new one.
 */
export function validateSavingsForm(
  values: SavingsFormValues,
  entries: SavingsEntry[],
  editingId: string | null,
): SavingsValidationResult {
  const errors: SavingsFormErrors = {}

  // Amount
  const rawAmount = values.amount.trim()
  let signedAmount: number | null = null

  if (rawAmount === '') {
    errors.amount = 'Enter an amount.'
  } else if (!/^\d+([.,]\d{1,2})?$/.test(rawAmount)) {
    errors.amount =
      'Enter a positive number with up to 2 decimals, such as 50 or 49.90.'
  } else {
    const parsed = Number(rawAmount.replace(',', '.'))
    if (parsed <= 0) {
      errors.amount = 'Enter an amount greater than zero.'
    } else if (parsed > MAX_ENTRY_AMOUNT) {
      errors.amount = 'That amount is too large.'
    } else {
      signedAmount = values.kind === 'withdrawal' ? -parsed : parsed

      // The saved total must never drop below zero.
      const othersCents = getBalanceCents(
        entries.filter((entry) => entry.id !== editingId),
      )
      if (othersCents + Math.round(signedAmount * 100) < 0) {
        if (values.kind === 'withdrawal') {
          errors.amount =
            othersCents > 0
              ? `You can't withdraw more than you've saved. The most you can withdraw is ${formatCurrency(othersCents / 100)}.`
              : 'There is nothing available to withdraw yet.'
        } else {
          errors.amount = `This would take your saved total below zero. Enter at least ${formatCurrency(-othersCents / 100)}.`
        }
      }
    }
  }

  // Date
  if (values.entryDate === '') {
    errors.entryDate = 'Choose a date.'
  } else if (!isValidDateOnly(values.entryDate)) {
    errors.entryDate = 'Enter a valid date.'
  } else if (values.entryDate > todayISO()) {
    // ISO dates compare correctly as strings.
    errors.entryDate = "Entries can't be dated in the future."
  }

  // Note
  const note = values.note.trim()
  if (note.length > NOTE_MAX_LENGTH) {
    errors.note = `Keep the note under ${NOTE_MAX_LENGTH} characters.`
  }

  if (Object.keys(errors).length > 0 || signedAmount === null) {
    return { errors, input: null }
  }

  return {
    errors,
    input: {
      amount: signedAmount,
      entryDate: values.entryDate,
      note: note === '' ? null : note,
    },
  }
}