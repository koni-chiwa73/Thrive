const wholeCurrencyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const exactCurrencyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
})

/** Parses a YYYY-MM-DD string as a local date (avoids UTC off-by-one bugs). */
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Whole euros show without decimals (€1,200), everything else with two (€250.50). */
export function formatCurrency(amount: number): string {
  return Number.isInteger(amount)
    ? wholeCurrencyFormatter.format(amount)
    : exactCurrencyFormatter.format(amount)
}

/** Always shows the sign: "+€50" or "−€20.50". */
export function formatSignedCurrency(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `−${formatted}` : `+${formatted}`
}

/** Formats a YYYY-MM-DD date string, e.g. "15 Dec 2026". */
export function formatDate(value: string): string {
  return dateFormatter.format(parseDateOnly(value))
}

/** Formats a YYYY-MM-01 month string, e.g. "March 2027". */
export function formatMonth(value: string): string {
  return monthFormatter.format(parseDateOnly(value))
}

/** Formats a full ISO timestamp, e.g. "12 Sep 2026". */
export function formatTimestamp(value: string): string {
  return dateFormatter.format(new Date(value))
}