import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { getErrorMessage } from '../../services/errors'
import { GOAL_CATEGORIES } from '../../types/goal'
import type { Goal, GoalInput } from '../../types/goal'
import {
  DESCRIPTION_MAX_LENGTH,
  EMPTY_FORM_VALUES,
  FIELD_ORDER,
  VALUE_TO_FIELD,
  getMonthOptions,
  goalToFormValues,
  validateGoalForm,
} from '../../utils/goalForm'
import type {
  GoalFormErrors,
  GoalFormField,
  GoalFormValues,
  TargetType,
} from '../../utils/goalForm'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import RadioChips from '../ui/RadioChips'
import { controlClasses } from '../ui/styles'

interface GoalFormProps {
  /** Pass a goal to edit it, or null to create a new one. */
  goal: Goal | null
  onSubmit: (input: GoalInput) => Promise<void>
  onCancel: () => void
}

const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: 'none', label: 'No deadline' },
  { value: 'date', label: 'Specific date' },
  { value: 'month', label: 'Month' },
]

export default function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const idPrefix = useId()
  const fieldId = (field: GoalFormField) => `${idPrefix}-${field}`

  const [values, setValues] = useState<GoalFormValues>(() =>
    goal ? goalToFormValues(goal) : EMPTY_FORM_VALUES,
  )
  const [errors, setErrors] = useState<GoalFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [monthOptions] = useState(() => getMonthOptions(values.targetMonth))

  function update<K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
    // Clear the related error as soon as the user starts fixing it.
    setErrors((previous) => ({ ...previous, [VALUE_TO_FIELD[key]]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const result = validateGoalForm(values)
    setErrors(result.errors)
    setSubmitError(null)

    if (!result.input) {
      const firstInvalid = FIELD_ORDER.find((field) => result.errors[field])
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(result.input)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't save your goal. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField id={fieldId('title')} label="Title" error={errors.title}>
        {(control) => (
          <input
            {...control}
            type="text"
            data-autofocus
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="e.g. Buy a new sofa"
            autoComplete="off"
            className={controlClasses(Boolean(errors.title))}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('description')}
        label="Description / notes"
        optional
        error={errors.description}
        hint={`${values.description.length}/${DESCRIPTION_MAX_LENGTH}`}
      >
        {(control) => (
          <textarea
            {...control}
            rows={3}
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
            className={controlClasses(Boolean(errors.description))}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('category')}
        label="Category"
        optional
        error={errors.category}
      >
        {(control) => (
          <select
            {...control}
            value={values.category}
            onChange={(event) => {
              const next = GOAL_CATEGORIES.find(
                (category) => category === event.target.value,
              )
              update('category', next ?? '')
            }}
            className={controlClasses(Boolean(errors.category))}
          >
            <option value="">No category</option>
            {GOAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-900">
          Target <span className="font-normal text-ink-500">(optional)</span>
        </legend>
        <RadioChips
          name={`${idPrefix}-targetType`}
          options={TARGET_OPTIONS}
          value={values.targetType}
          onChange={(targetType) => update('targetType', targetType)}
        />

        {values.targetType === 'date' && (
          <div className="mt-3">
            <FormField
              id={fieldId('target')}
              label="Target date"
              error={errors.target}
            >
              {(control) => (
                <input
                  {...control}
                  type="date"
                  value={values.targetDate}
                  onChange={(event) => update('targetDate', event.target.value)}
                  className={controlClasses(Boolean(errors.target))}
                />
              )}
            </FormField>
          </div>
        )}

        {values.targetType === 'month' && (
          <div className="mt-3">
            <FormField
              id={fieldId('target')}
              label="Target month"
              error={errors.target}
            >
              {(control) => (
                <select
                  {...control}
                  value={values.targetMonth}
                  onChange={(event) => update('targetMonth', event.target.value)}
                  className={controlClasses(Boolean(errors.target))}
                >
                  <option value="">Choose a month</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
        )}
      </fieldset>

      <FormField
        id={fieldId('targetAmount')}
        label="Savings target"
        optional
        hint="Amount in euros (€). Leave empty if this goal doesn't involve money."
        error={errors.targetAmount}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            inputMode="decimal"
            value={values.targetAmount}
            onChange={(event) => update('targetAmount', event.target.value)}
            placeholder="e.g. 1200"
            autoComplete="off"
            className={controlClasses(Boolean(errors.targetAmount))}
          />
        )}
      </FormField>

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
          {isSubmitting ? 'Saving…' : goal ? 'Save changes' : 'Add goal'}
        </Button>
      </div>
    </form>
  )
}