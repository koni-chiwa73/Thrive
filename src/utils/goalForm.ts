import { GOAL_CATEGORIES } from '../types/goal'
import type { Goal, GoalCategory, GoalInput } from '../types/goal'
import { isValidDateOnly } from './dates'
import { formatMonth } from './format'

export type TargetType = 'none' | 'date' | 'month'

/** Raw form state: everything is a string, exactly as the inputs hold it. */
export interface GoalFormValues {
  title: string
  description: string
  category: GoalCategory | ''
  targetType: TargetType
  /** YYYY-MM-DD */
  targetDate: string
  /** YYYY-MM */
  targetMonth: string
  targetAmount: string
}

export type GoalFormField =
  | 'title'
  | 'description'
  | 'category'
  | 'target'
  | 'targetAmount'

export type GoalFormErrors = Partial<Record<GoalFormField, string>>

/** Top-to-bottom order of fields, used to focus the first invalid one. */
export const FIELD_ORDER: GoalFormField[] = [
  'title',
  'description',
  'category',
  'target',
  'targetAmount',
]

/** Which error to clear when a given form value changes. */
export const VALUE_TO_FIELD: Record<keyof GoalFormValues, GoalFormField> = {
  title: 'title',
  description: 'description',
  category: 'category',
  targetType: 'target',
  targetDate: 'target',
  targetMonth: 'target',
  targetAmount: 'targetAmount',
}

export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 1000
const MAX_TARGET_AMOUNT = 10_000_000

export const EMPTY_FORM_VALUES: GoalFormValues = {
  title: '',
  description: '',
  category: '',
  targetType: 'none',
  targetDate: '',
  targetMonth: '',
  targetAmount: '',
}

export function goalToFormValues(goal: Goal): GoalFormValues {
  let targetType: TargetType = 'none'
  if (goal.targetDate) targetType = 'date'
  else if (goal.targetMonth) targetType = 'month'

  return {
    title: goal.title,
    description: goal.description ?? '',
    category: goal.category ?? '',
    targetType,
    targetDate: goal.targetDate ?? '',
    // Stored as YYYY-MM-01, the form works with YYYY-MM.
    targetMonth: goal.targetMonth ? goal.targetMonth.slice(0, 7) : '',
    targetAmount: goal.targetAmount !== null ? String(goal.targetAmount) : '',
  }
}

export interface ValidationResult {
  errors: GoalFormErrors
  /** Null when there is at least one error. */
  input: GoalInput | null
}

export function validateGoalForm(values: GoalFormValues): ValidationResult {
  const errors: GoalFormErrors = {}

  // Title
  const title = values.title.trim()
  if (title === '') {
    errors.title = 'Give your goal a title.'
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Keep the title under ${TITLE_MAX_LENGTH} characters.`
  }

  // Description
  const description = values.description.trim()
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the notes under ${DESCRIPTION_MAX_LENGTH} characters.`
  }

  // Category (find() narrows the string to a valid GoalCategory without casting)
  const category = GOAL_CATEGORIES.find((item) => item === values.category) ?? null

  // Target: only one of date / month is ever kept
  let targetDate: string | null = null
  let targetMonth: string | null = null

  if (values.targetType === 'date') {
    if (values.targetDate === '') {
      errors.target = 'Choose a date, or select “No deadline”.'
    } else if (!isValidDateOnly(values.targetDate)) {
      errors.target = 'Enter a valid date between 2000 and 2100.'
    } else {
      targetDate = values.targetDate
    }
  } else if (values.targetType === 'month') {
    if (values.targetMonth === '') {
      errors.target = 'Choose a month, or select “No deadline”.'
    } else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.targetMonth)) {
      errors.target = 'Choose a valid month.'
    } else {
      targetMonth = `${values.targetMonth}-01`
    }
  }

  // Target amount: optional, positive, max 2 decimals. No thousands
  // separators, because "1,200" would be ambiguous (1.20 or 1200?).
  const rawAmount = values.targetAmount.trim()
  let targetAmount: number | null = null

  if (rawAmount !== '') {
    if (!/^\d+([.,]\d{1,2})?$/.test(rawAmount)) {
      errors.targetAmount =
        'Enter a number with up to 2 decimals, such as 1200 or 1200.50.'
    } else {
      const parsed = Number(rawAmount.replace(',', '.'))
      if (parsed <= 0) {
        errors.targetAmount = 'Enter an amount greater than zero.'
      } else if (parsed > MAX_TARGET_AMOUNT) {
        errors.targetAmount = 'That amount is too large.'
      } else {
        targetAmount = parsed
      }
    }
  }

  if (Object.keys(errors).length > 0) return { errors, input: null }

  return {
    errors,
    input: {
      title,
      description: description === '' ? null : description,
      category,
      targetDate,
      targetMonth,
      targetAmount,
    },
  }
}

export interface MonthOption {
  value: string
  label: string
}

/**
 * Months for the "Month" target picker: the current month plus the next 47.
 * If the goal already has a month outside that range, it is included so
 * editing never silently drops it.
 */
export function getMonthOptions(
  selected: string,
  monthsAhead = 48,
  now: Date = new Date(),
): MonthOption[] {
  const toOption = (year: number, monthIndex: number): MonthOption => {
    const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    return { value, label: formatMonth(`${value}-01`) }
  }

  const options: MonthOption[] = []
  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push(toOption(date.getFullYear(), date.getMonth()))
  }

  if (selected !== '' && !options.some((option) => option.value === selected)) {
    const [year, month] = selected.split('-').map(Number)
    options.push(toOption(year, month - 1))
  }

  // YYYY-MM strings sort chronologically.
  return options.sort((a, b) => a.value.localeCompare(b.value))
}