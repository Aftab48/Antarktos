import { formatNumber, type Locale } from '@/i18n'

// Decimal units, as the upload limits are stated (plan §6.3). Under 1 MB in whole kB (never "0 MB"), else MB to one decimal.
export function fileSize(l: Locale, bytes?: number): string | undefined {
  if (!bytes || bytes < 0) return undefined
  return bytes < 999_500
    ? formatNumber(l, Math.max(1, Math.round(bytes / 1e3)), { style: 'unit', unit: 'kilobyte' })
    : formatNumber(l, bytes / 1e6, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 })
}
