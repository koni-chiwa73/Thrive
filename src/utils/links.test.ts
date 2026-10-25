import { describe, expect, it } from 'vitest'
import { makeGoal } from '../test/factories'
import {
  getHostname,
  getSafeHref,
  parseWebUrl,
  validateLinkForm,
} from './links'

describe('parseWebUrl', () => {
  it('adds https:// when the scheme is missing', () => {
    expect(parseWebUrl('example.com/page')?.href).toBe('https://example.com/page')
  })

  it('keeps an explicit http address', () => {
    expect(parseWebUrl('http://example.com')?.protocol).toBe('http:')
  })

  it.each([
    '',
    '   ',
    'hello',
    'https://sofa',
    'javascript:alert(1)',
    'mailto:a@b.com',
    'ftp://example.com',
    'https://user:pass@example.com',
    'https://exa mple.com',
  ])('rejects "%s"', (input) => {
    expect(parseWebUrl(input)).toBeNull()
  })
})

describe('getSafeHref', () => {
  it('returns a normalised address for good input', () => {
    expect(getSafeHref('https://example.com/a')).toBe('https://example.com/a')
  })

  it('returns null for an unsafe stored value', () => {
    expect(getSafeHref('javascript:alert(1)')).toBeNull()
  })
})

describe('getHostname', () => {
  it('drops a leading www.', () => {
    expect(getHostname('https://www.example.com/x')).toBe('example.com')
  })
})

describe('validateLinkForm', () => {
  it('rejects an empty address', () => {
    const result = validateLinkForm({ url: '', title: '', note: '' })
    expect(result.errors.url).toBeDefined()
    expect(result.input).toBeNull()
  })

  it('normalises the address and trims optional fields', () => {
    const result = validateLinkForm({
      url: 'example.com/page',
      title: '  My link ',
      note: '',
    })
    expect(result.input).toEqual({
      url: 'https://example.com/page',
      title: 'My link',
      note: null,
    })
  })

  it('rejects an overlong title', () => {
    const result = validateLinkForm({
      url: 'example.com',
      title: 'x'.repeat(101),
      note: '',
    })
    expect(result.errors.title).toBeDefined()
  })

  it('uses a different goal factory without sharing state', () => {
    // Guards against the factories accidentally sharing mutable defaults.
    const first = makeGoal()
    const second = makeGoal()
    first.links.push({
      id: 'l',
      goalId: 'g',
      title: null,
      url: 'https://example.com',
      note: null,
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(second.links).toHaveLength(0)
  })
})