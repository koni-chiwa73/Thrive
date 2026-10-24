import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { getErrorMessage } from '../../services/errors'
import type { SavingsEntry, SavingsEntryInput } from '../../types/goal'
import { todayISO } from '../../utils/dates'
import {
  NOTE_MAX_LENGTH,
  SAVINGS_FIELD_ORDER,
  SAVINGS_VALUE_TO_FIELD,
  createEmptySavingsValues,
  entryToFormValues,
  validateSavingsForm,
} from '../../utils/savingsForm'
import type {
  EntryKind,
  SavingsFormErrors,
  SavingsFormField,
  SavingsFormValues,
} from '../../utils/savingsForm'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import RadioChips from '../ui/RadioChips'
import { controlClasses } from '../ui/styles'

interface SavingsEntryFormProps {
  /** Pass an entry to edit it, or null to add a new one. */
  entry: SavingsEntry | null
  /** All entries of the goal, used for the "never below zero" check. */
  entries: SavingsEntry[]
  onSubmit: (input: SavingsEntryInput) => Promise<void>
  onCancel: () => void
}

const KIND_OPTIONS: { value: EntryKind; label: string }[] = [
  { value: 'deposit', label: 'Money saved' },
  { value: 'withdrawal', label: 'Withdrawal' },
]

export default function SavingsEntryForm({
  entry,
  entries,
  onSubmit,
  onCancel,
}: SavingsEntryFormProps) {
  const idPrefix = useId()
  const fieldId = (field: SavingsFormField) => `${idPrefix}-${field}`

  const [values, setValues] = useState<SavingsFormValues>(() =>
    entry ? entryToFormValues(entry) : createEmptySavingsValues(),
  )
  const [errors, setErrors] = useState<SavingsFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function update<K extends keyof SavingsFormValues>(
    key: K,
    value: SavingsFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({
      ...previous,
      [SAVINGS_VALUE_TO_FIELD[key]]: undefined,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const result = validateSavingsForm(values, entries, entry?.id ?? null)
    setErrors(result.errors)
    setSubmitError(null)

    if (!result.input) {
      const firstInvalid = SAVINGS_FIELD_ORDER.find(
        (field) => result.errors[field],
      )
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(result.input)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't save this entry. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-900">Type</legend>
        <RadioChips
          name={`${idPrefix}-kind`}
          options={KIND_OPTIONS}
          value={values.kind}
          onChange={(kind) => update('kind', kind)}
        />
      </fieldset>

      <FormField
        id={fieldId('amount')}
        label="Amount (€)"
        error={errors.amount}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            inputMode="decimal"
            data-autofocus
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
            placeholder="e.g. 50"
            autoComplete="off"
            className={controlClasses(Boolean(errors.amount))}
          />
        )}
      </FormField>

      <FormField id={fieldId('entryDate')} label="Date" error={errors.entryDate}>
        {(control) => (
          <input
            {...control}
            type="date"
            max={todayISO()}
            value={values.entryDate}
            onChange={(event) => update('entryDate', event.target.value)}
            className={controlClasses(Boolean(errors.entryDate))}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('note')}
        label="Note"
        optional
        error={errors.note}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            value={values.note}
            onChange={(event) => update('note', event.target.value)}
            placeholder="e.g. Birthday money"
            autoComplete="off"
            className={controlClasses(Boolean(errors.note))}
          />
        )}
      </FormField>

      <p className="-mt-2 text-xs text-ink-500">
        {values.note.length}/{NOTE_MAX_LENGTH}
      </p>

      {submitError && (
        <p role="alert" className="text-sm text-clay-600">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : entry ? 'Save changes' : 'Add entry'}
        </Button>
      </div>
    </form>
  )
}