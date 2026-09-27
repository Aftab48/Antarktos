// Public reads (plan §8.2). Everything goes through `find`: access control on with no user, so only published
// documents come back, populated relationships included (a draft cover or photo is left as a bare id).
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getPayload, type CollectionSlug, type PaginatedDocs, type Where } from 'payload'
import { cache } from 'react'

import { isLocale, pick, type Locale } from '@/i18n'

export type Doc = Record<string, any>
export type Params<T = object> = Promise<{ lang: string } & T>

// The [lang] segment: 'en' (rewritten from /) or 'hi'; anything else is a 404.
export async function pageLocale(params: Params): Promise<Locale> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return lang
}

export const REGIONS = ['antarctic', 'arctic', 'southern_ocean', 'himalaya'] as const

// A populated relationship; a draft (or missing) related document stays a bare id and is left out.
export const rel = (v: unknown): Doc | null => (v && typeof v === 'object' ? (v as Doc) : null)
export const rels = (v: unknown): Doc[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [])

export const RECORD_TYPES = ['reports', 'datasets', 'publications', 'media', 'events'] as const
export type RecordType = (typeof RECORD_TYPES)[number]
export const isRecordType = (v: unknown): v is RecordType => RECORD_TYPES.includes(v as RecordType)
// Newest first (Postgres puts missing values first on a descending sort, so dated fields only where always set).
export const RECORD_SORT: Record<RecordType, string> = {
  reports: '-year',
  datasets: '-year',
  publications: '-year',
  media: '-createdAt',
  events: '-date',
}

// Rendered per request, so a publish or unpublish shows at once.
async function cms() {
  await connection()
  return getPayload({ config })
}

type FindOpts = { where?: Where; sort?: string; limit?: number; page?: number; depth?: number }

// locale 'all': localized fields come back as { en, hi }, so pages know when Hindi falls back to English (see pick).
export async function find(collection: CollectionSlug, { where, sort, limit = 100, page, depth = 0 }: FindOpts = {}): Promise<PaginatedDocs<Doc>> {
  return (await cms()).find({
    collection,
    overrideAccess: false,
    draft: false,
    locale: 'all',
    where,
    sort,
    depth,
    page,
    ...(limit === 0 ? { pagination: false } : { limit }),
  }) as Promise<PaginatedDocs<Doc>>
}

export const count = async (collection: CollectionSlug, where?: Where) =>
  (await (await cms()).count({ collection, overrideAccess: false, where })).totalDocs

// One published document by its id from the URL; cached per request so generateMetadata and the page share it.
export const findOne = cache(async (collection: CollectionSlug, id: string): Promise<Doc | null> => {
  if (!/^\d{1,9}$/.test(id)) return null
  return (await find(collection, { where: { id: { equals: Number(id) } }, depth: 1, limit: 1 })).docs[0] ?? null
})

// Every archive record type linked to an expedition or station (plan §5: its page gathers all of them).
export async function linkedRecords(where: Where, limit = 24) {
  const results = await Promise.all(RECORD_TYPES.map((c) => find(c, { where, sort: RECORD_SORT[c], limit })))
  return RECORD_TYPES.map((type, i) => ({ type, docs: results[i].docs as Doc[], total: results[i].totalDocs }))
}

// PDF page of each cited chunk ([c:id] markers in a summary), for this record only. Only page numbers leave here.
export async function citedPages(collection: string, docId: number, ids: number[]): Promise<Map<number, number | null>> {
  if (!ids.length) return new Map()
  const { rows } = await (await cms()).db.drizzle.execute(sql`
    select id, page from archive_chunks
    where collection = ${collection} and doc_id = ${String(docId)} and id = any(string_to_array(${ids.join(',')}, ',')::bigint[])`)
  return new Map(rows.map((r: Doc) => [Number(r.id), r.page == null ? null : Number(r.page)]))
}

export { pick } from '@/i18n'
export const text = (v: unknown, l: Locale) => pick(v, l)?.value ?? ''

// Staff-entered links are shown only when they are http(s).
export const safeUrl = (u: unknown) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : undefined)
