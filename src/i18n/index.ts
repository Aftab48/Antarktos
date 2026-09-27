// Public UI strings (AGENTS.md: plain dictionaries, no i18n library). Content text comes from Payload localization.
import en from './en.json'
import hi from './hi.json'

export const locales = ['en', 'hi'] as const
export type Locale = (typeof locales)[number]
export type Key = keyof typeof en
// Typed against en.json, so a key missing from hi.json fails `tsc`.
const dicts: Record<Locale, Record<Key, string>> = { en, hi }

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v)

// t('archive.results', { count: 3 }) -> "Results: 3"
export const translator =
  (l: Locale) =>
  (key: Key, vars?: Record<string, string | number>): string =>
    vars ? dicts[l][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : dicts[l][key]

// English lives at /, Hindi at /hi (plan §5).
export const href = (l: Locale, path: string) => (l === 'hi' ? (path === '/' ? '/hi' : `/hi${path}`) : path)

// The same page in the other language; `path` is the browser path (with /hi for Hindi), query kept.
export function otherLocaleHref(l: Locale, path: string): string {
  if (l === 'en') return path === '/' ? '/hi' : path.startsWith('/?') ? `/hi${path.slice(1)}` : `/hi${path}`
  const rest = path.replace(/^\/hi(?=\/|\?|$)/, '')
  return rest === '' || rest.startsWith('?') ? `/${rest}` : rest
}

const tag = (l: Locale) => (l === 'hi' ? 'hi-IN' : 'en-IN')
// Payload date fields are midnight UTC (seed) or midnight IST (admin date picker): IST shows both on the right day.
export const formatDate = (l: Locale, iso: string) =>
  new Intl.DateTimeFormat(tag(l), { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
export const formatNumber = (l: Locale, n: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(tag(l), opts).format(n)
