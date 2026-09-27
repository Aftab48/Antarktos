import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { devanagariShare, numbersIn } from '../pipeline/text'
import { COLLECTIONS, type Locale, type RetrievedChunk, type SearchFilters } from './types'

export class InputError extends Error {}
export function normalizeQuestion(value: string) { return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase() }
export function validateQuestion(value: unknown): string {
  if (typeof value !== 'string' || [...value].length > 300 || !value.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) throw new InputError('invalid_question')
  const question = value.normalize('NFKC').trim().replace(/\s+/gu, ' ')
  if ([...question].length > 300) throw new InputError('invalid_question')
  return question
}
export function parseSearchFilters(params: URLSearchParams): SearchFilters {
  const q = params.get('q')?.trim() ?? ''
  if ([...q].length > 300 || q.includes('\0')) throw new InputError('invalid_filters')
  const locale = params.get('locale') || 'en'
  const collection = params.get('collection') || undefined
  const region = params.get('region') || undefined
  if (!['en', 'hi'].includes(locale) || (collection && !(COLLECTIONS as readonly string[]).includes(collection)) || (region && !['antarctic', 'arctic', 'southern_ocean', 'himalaya'].includes(region))) throw new InputError('invalid_filters')
  const number = (key: string, min: number, max: number): number | undefined => {
    const raw = params.get(key)
    if (!raw) return undefined
    if (!/^\d{1,9}$/u.test(raw) || Number(raw) < min || Number(raw) > max) throw new InputError('invalid_filters')
    return Number(raw)
  }
  return { q, locale: locale as Locale, collection: collection as SearchFilters['collection'], region,
    year: number('year', 1900, 2100), expedition: number('expedition', 1, 999999999), station: number('station', 1, 999999999), page: number('page', 1, 1000) ?? 1 }
}

// The edge-owned Vercel header is trusted only on Vercel. Arbitrary forwarding headers
// cannot create fresh buckets. Local development shares one bucket, regardless of headers.
export function hashedClientIP(headers: Headers, env: NodeJS.ProcessEnv = process.env): string {
  if (!env.IP_HASH_SALT) throw new Error('IP hashing is not configured')
  let ip: string
  if (env.VERCEL === '1') {
    ip = headers.get('x-vercel-forwarded-for')?.trim() ?? ''
    if (!isIP(ip)) throw new Error('Trusted client IP is unavailable')
    // Canonicalize IPv6 alternate spellings so equivalent addresses share a bucket.
    if (isIP(ip) === 6) ip = new URL(`http://[${ip}]/`).hostname
  } else if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') ip = 'local-development'
  else throw new Error('Trusted client IP is unavailable')
  return createHmac('sha256', env.IP_HASH_SALT).update(ip).digest('hex')
}

export async function boundedJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new InputError('invalid_question')
  const reader = request.body?.getReader()
  if (!reader) throw new InputError('invalid_question')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 4096) { await reader.cancel(); throw new InputError('invalid_question') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch { throw new InputError('invalid_question') }
}

export function validateAnswer(raw: string, chunks: RetrievedChunk[], locale: Locale) {
  const o: unknown = JSON.parse(raw)
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('Invalid answer schema')
  const object = o as Record<string, unknown>
  if (Object.keys(object).length !== 1 || !Array.isArray(object.sentences) || object.sentences.length > 5 || !object.sentences.every((s) => typeof s === 'string' && [...s].length <= 450)) throw new Error('Invalid answer schema')
  const byId = new Map(chunks.map((c) => [c.chunkId, c.text]))
  const kept: string[] = []
  const checks = { schema: true, citations: true, numbers: true, language: true, sentences: true }
  for (const value of object.sentences as string[]) {
    let sentence = value.trim().replace(/\[c:([^\]]*)\]/gu, (marker, id: string) => {
      if (byId.has(id)) return marker
      checks.citations = false
      return ''
    }).replace(/\s+/gu, ' ')
    const end = sentence.match(/(?:\s*\[c:[1-9]\d*\])+[.!?।]?$/u)
    const allIds = [...sentence.matchAll(/\[c:(\d+)\]/gu)].map((m) => m[1])
    if (!end || !allIds.length || /\[c:/u.test(sentence.slice(0, end.index))) { checks.citations = false; continue }
    const prose = sentence.slice(0, end.index).trim()
    // Fail closed on multiple sentences in one array entry, including no-space punctuation.
    // Decimal dots are allowed; abbreviations can be written out by the model.
    if (!prose || /[!?।\n]|(?<!\d)\.|\.(?!\d)/u.test(prose)) { checks.sentences = false; continue }
    const allowed = new Set(allIds.flatMap((id) => numbersIn(byId.get(id)!)))
    if (numbersIn(prose).some((n) => !allowed.has(n))) { checks.numbers = false; continue }
    const share = devanagariShare(prose)
    if (locale === 'hi' ? share < 0.6 : share > 0.05 || !/[a-z]/iu.test(prose)) { checks.language = false; continue }
    sentence = sentence.replace(/\s+([.!?।])/gu, '$1')
    if (!kept.includes(sentence)) kept.push(sentence)
  }
  // Generation requests 2–5 sentences; filtering must preserve each independently
  // supported sentence even when dropping the others leaves just one.
  return { sentences: kept, checks }
}
