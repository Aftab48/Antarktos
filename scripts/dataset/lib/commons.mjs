// Wikimedia Commons API helpers: search + imageinfo + license classification.
// Uses global fetch (Node 18+), no HTTP client dependency.
const API = 'https://commons.wikimedia.org/w/api.php'
export const USER_AGENT = 'SIH26063-DatasetCollector/1.0 (https://github.com/Aftab48/SIH26063)'

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ponytail: this sandbox's network hiccups with an occasional ETIMEDOUT on the first
// connection to a host; a few retries with backoff is cheaper than chasing the root cause.
export async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(url, options)
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await sleep(1000 * (i + 1))
    }
  }
  throw lastErr
}

async function apiGet(params) {
  const url = new URL(API)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${url}`)
  return res.json()
}

/** Search the File namespace (6) for a query, return file titles ("File:Foo.jpg"). */
export async function searchFiles(query, limit = 50) {
  const data = await apiGet({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6',
    srlimit: String(limit),
    format: 'json',
  })
  return (data.query?.search ?? []).map((r) => r.title)
}

/** Fetch imageinfo (url, license metadata, EXIF-ish metadata) for up to ~50 titles at once. */
export async function getImageInfo(titles) {
  if (titles.length === 0) return []
  const data = await apiGet({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata|metadata|user',
    format: 'json',
  })
  const pages = data.query?.pages ?? {}
  return Object.values(pages)
    .filter((p) => Array.isArray(p.imageinfo) && p.imageinfo.length > 0)
    .map((p) => ({ title: p.title, info: p.imageinfo[0] }))
}

export function stripHtml(s) {
  return (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Normalize a Commons LicenseShortName to one of: cc0 | pd | cc-by | cc-by-sa.
 * Returns null for anything else (NC/ND variants, "All rights reserved", unknown, missing).
 */
export function classifyLicense(shortName) {
  const s = (shortName ?? '').toLowerCase()
  if (!s) return null
  // Exclude non-commercial / no-derivatives variants outright, even if "by" also matches below.
  if (/\bnc\b|non[- ]?commercial|\bnd\b|no[- ]?derivative/.test(s)) return null
  if (/cc0/.test(s)) return 'cc0'
  if (/by-sa|by sa/.test(s)) return 'cc-by-sa'
  if (/\bpublic domain\b|^pd\b|\bpd-/.test(s)) return 'pd'
  if (/\bby\b/.test(s)) return 'cc-by'
  return null
}

/** Best-effort GPS presence check across extmetadata and raw EXIF metadata. */
export function hasGps(info) {
  const em = info.extmetadata ?? {}
  const latKey = Object.keys(em).find((k) => /gpslatitude/i.test(k))
  if (latKey && stripHtml(em[latKey]?.value)) return true
  const meta = Array.isArray(info.metadata) ? info.metadata : []
  return meta.some((m) => /gpslatitude/i.test(m?.name ?? '') && m?.value)
}
