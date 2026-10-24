/** Shared look for text inputs, textareas, and selects. */
export function controlClasses(hasError: boolean): string {
  const border = hasError
    ? 'border-clay-600'
    : 'border-sand-300 hover:border-sand-400'
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 transition-colors ${border}`
}