import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { getErrorMessage } from '../../services/errors'
import type { GoalLink, GoalLinkInput } from '../../types/goal'
import {
  EMPTY_LINK_VALUES,
  LINK_FIELD_ORDER,
  LINK_NOTE_MAX_LENGTH,
  linkToFormValues,
  validateLinkForm,
} from '../../utils/links'
import type {
  LinkFormErrors,
  LinkFormField,
  LinkFormValues,
} from '../../utils/links'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import { controlClasses } from '../ui/styles'

interface LinkFormProps {
  /** Pass a link to edit it, or null to add a new one. */
  link: GoalLink | null
  onSubmit: (input: GoalLinkInput) => Promise<void>
  onCancel: () => void
}

export default function LinkForm({ link, onSubmit, onCancel }: LinkFormProps) {
  const idPrefix = useId()
  const fieldId = (field: LinkFormField) => `${idPrefix}-${field}`

  const [values, setValues] = useState<LinkFormValues>(() =>
    link ? linkToFormValues(link) : EMPTY_LINK_VALUES,
  )
  const [errors, setErrors] = useState<LinkFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function update(key: keyof LinkFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const result = validateLinkForm(values)
    setErrors(result.errors)
    setSubmitError(null)

    if (!result.input) {
      const firstInvalid = LINK_FIELD_ORDER.find((field) => result.errors[field])
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(result.input)
    } catch (caught) {
      setSubmitError(
        getErrorMessage(caught, "We couldn't save this link. Please try again."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField
        id={fieldId('url')}
        label="Web address"
        hint="You can leave out https://."
        error={errors.url}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            inputMode="url"
            data-autofocus
            value={values.url}
            onChange={(event) => update('url', event.target.value)}
            placeholder="e.g. example.com/sofas"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className={controlClasses(Boolean(errors.url))}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('title')}
        label="Display name"
        optional
        hint="Shown instead of the web address."
        error={errors.title}
      >
        {(control) => (
          <input
            {...control}
            type="text"
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="e.g. Favourite sofa"
            autoComplete="off"
            className={controlClasses(Boolean(errors.title))}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('note')}
        label="Note"
        optional
        hint={`${values.note.length}/${LINK_NOTE_MAX_LENGTH}`}
        error={errors.note}
      >
        {(control) => (
          <textarea
            {...control}
            rows={2}
            value={values.note}
            onChange={(event) => update('note', event.target.value)}
            className={controlClasses(Boolean(errors.note))}
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
          {isSubmitting ? 'Saving…' : link ? 'Save changes' : 'Add link'}
        </Button>
      </div>
    </form>
  )
}