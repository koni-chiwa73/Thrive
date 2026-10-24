import type { GoalLink, GoalLinkInput } from '../types/goal'

export interface LinkFormValues {
  url: string
  title: string
  note: string
}

export type LinkFormField = 'url' | 'title' | 'note'
export type LinkFormErrors = Partial<Record<LinkFormField, string>>

export const LINK_FIELD_ORDER: LinkFormField[] = ['url', 'title', 'note']

export const URL_MAX_LENGTH = 2000
export const LINK_TITLE_MAX_LENGTH = 100
export const LINK_NOTE_MAX_LENGTH = 300

export const EMPTY_LINK_VALUES: LinkFormValues = { url: '', title: '', note: '' }

/**
 * Parses a user-entered web address. A missing scheme becomes https://.
 * Only http(s) addresses with a normal host and no embedded credentials
 * are accepted, which rules out javascript:, data:, mailto:, and similar.
 */
export function parseWebUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (trimmed === '' || /\s/.test(trimmed)) return null

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username !== '' || url.password !== '') return null
    // Requiring a dot catches typos like "https://sofa".
    if (!url.hostname.includes('.')) return null
    return url
  } catch {
    return null
  }
}

/**
 * Returns a URL that is safe to put in an href, or null.
 * Checked again at render time, so a bad stored value is never clickable.
 */
export function getSafeHref(url: string): string | null {
  return parseWebUrl(url)?.href ?? null
}

export function getHostname(url: string): string {
  const parsed = parseWebUrl(url)
  return parsed ? parsed.hostname.replace(/^www\./, '') : url
}

export function getLinkLabel(link: GoalLink): string {
  return link.title ?? getHostname(link.url)
}

export function linkToFormValues(link: GoalLink): LinkFormValues {
  return { url: link.url, title: link.title ?? '', note: link.note ?? '' }
}

export interface LinkValidationResult {
  errors: LinkFormErrors
  /** Null when there is at least one error. */
  input: GoalLinkInput | null
}

export function validateLinkForm(values: LinkFormValues): LinkValidationResult {
  const errors: LinkFormErrors = {}

  const rawUrl = values.url.trim()
  const parsed = parseWebUrl(rawUrl)
  if (rawUrl === '') {
    errors.url = 'Paste or type a web address.'
  } else if (rawUrl.length > URL_MAX_LENGTH) {
    errors.url = 'That web address is too long.'
  } else if (parsed === null) {
    errors.url = 'Enter a valid web address, such as example.com/page.'
  }

  const title = values.title.trim()
  if (title.length > LINK_TITLE_MAX_LENGTH) {
    errors.title = `Keep the name under ${LINK_TITLE_MAX_LENGTH} characters.`
  }

  const note = values.note.trim()
  if (note.length > LINK_NOTE_MAX_LENGTH) {
    errors.note = `Keep the note under ${LINK_NOTE_MAX_LENGTH} characters.`
  }

  if (Object.keys(errors).length > 0 || parsed === null) {
    return { errors, input: null }
  }

  return {
    errors,
    input: {
      url: parsed.href,
      title: title === '' ? null : title,
      note: note === '' ? null : note,
    },
  }
}