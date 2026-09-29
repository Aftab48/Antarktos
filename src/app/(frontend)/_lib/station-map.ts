import { href, pick, type Locale } from '@/i18n'

export type StationPoint = { id: number; name: string; lang: Locale; lat: number; lng: number; url: string; historical: boolean }

export function stationPoints(docs: Record<string, unknown>[], locale: Locale): StationPoint[] {
  return docs.flatMap((doc) => {
    const name = pick<string>(doc.name, locale)
    if (doc._status !== 'published' || !name || typeof doc.id !== 'number' ||
      typeof doc.lat !== 'number' || !Number.isFinite(doc.lat) || Math.abs(doc.lat) > 85.05112878 ||
      typeof doc.lng !== 'number' || !Number.isFinite(doc.lng) || Math.abs(doc.lng) > 180) return []
    return [{ id: doc.id, name: name.value, lang: name.lang, lat: doc.lat, lng: doc.lng, url: href(locale, `/stations/${doc.id}`), historical: doc.operational_status === 'historical' }]
  })
}
