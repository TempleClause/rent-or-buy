const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

/** CHF 1'234'568 — Swiss format, rounded to whole francs, with sign handling. */
export function formatMoney(value: number): string {
  const formatted = chf.format(Math.abs(value))
  return value < 0 ? `−${formatted}` : formatted
}

/** CHF 1.2M / CHF 340k — compact form for chart axes and tight chips. */
export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}CHF ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${sign}CHF ${Math.round(abs / 1_000)}k`
  return `${sign}CHF ${Math.round(abs)}`
}

/** 6.5% — trims trailing zeros. */
export function formatPercent(value: number): string {
  return `${parseFloat(value.toFixed(2))}%`
}

/** "12 years" / "1 year" */
export function formatYears(value: number): string {
  return `${value} ${value === 1 ? 'year' : 'years'}`
}
