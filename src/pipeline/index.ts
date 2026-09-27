// Processing pipeline (plan §7): extract -> chunk -> index -> summarize / caption, started after a save.
import { sql } from '@payloadcms/db-postgres'
import { after } from 'next/server'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, CollectionSlug, Payload } from 'payload'
import { extractText, getDocumentProxy } from 'unpdf'

import { caption, summarize, type SourceChunk } from './ai'
import { chunkPages, cleanPages, needsOcr, stripMarkers } from './text'

type Doc = Record<string, any>
type Locale = 'en' | 'hi'
export type State = 'queued' | 'processing' | 'ready' | 'needs_ocr' | 'failed'

// Collections with processing_state / processing_error columns (plan §8.1).
export const STATEFUL = ['reports', 'datasets', 'publications', 'media', 'events']
// Collections whose full run can call an LLM.
export const LLM_COLLECTIONS = ['reports', 'media']

// The record's own text, indexed as one chunk per locale at position 0 (plan §7: metadata-only records are
// just this chunk). Heading = title or name.
const META_FIELDS: Record<string, string[]> = {
  reports: ['summary', 'keywords'],
  datasets: ['abstract', 'keywords', 'parameters', 'format'],
  publications: ['authors', 'venue', 'abstract'],
  media: ['caption', 'alt', 'tags'],
  events: ['description', 'location'],
  expeditions: ['summary', 'highlights', 'leader'],
  stations: ['description'],
}

// Read with locale 'all': localized fields come back as { en, hi }; other fields count as English only.
const inLocale = (v: unknown, locale: Locale): unknown =>
  v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'hi' in v) ? (v as Doc)[locale] : locale === 'en' ? v : undefined
const textOf = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap((x) => (typeof x === 'string' ? [x] : typeof x?.text === 'string' ? [x.text] : [])) : []
const first = (v: unknown, locale: Locale) => textOf(inLocale(v, locale))[0]?.trim() || ''

type Row = { locale: Locale; position: number; page: number | null; heading: string | null; text: string }

function metaChunks(collection: string, doc: Doc): Row[] {
  return (['en', 'hi'] as const).flatMap((locale) => {
    const heading = first(doc.title ?? doc.name, locale) || null
    const text = stripMarkers((META_FIELDS[collection] ?? []).flatMap((f) => textOf(inLocale(doc[f], locale))).join('\n'))
    return heading || text ? [{ locale, position: 0, page: null, heading, text }] : []
  })
}

// ---- archive_chunks (plan §11) ----
// Rows are upserted on (collection, doc_id, locale, position), so re-processing the same text keeps chunk ids
// stable and the [c:id] citations in summaries and outreach posts keep pointing at the right text.

async function writeChunks(payload: Payload, collection: string, id: number | string, rows: Row[], part: 'meta' | 'pages') {
  const db = payload.db.drizzle
  const docId = String(id)
  const json = JSON.stringify(rows)
  if (rows.length) {
    await db.execute(sql`
      insert into archive_chunks (collection, doc_id, locale, position, page, heading, text)
      select ${collection}, ${docId}, x.locale, x.position, x.page, x.heading, x.text
      from jsonb_to_recordset(${json}::jsonb) as x(locale text, position int, page int, heading text, text text)
      on conflict (collection, doc_id, locale, position) do update
        set page = excluded.page, heading = excluded.heading, text = excluded.text
        where (archive_chunks.page, archive_chunks.heading, archive_chunks.text) is distinct from (excluded.page, excluded.heading, excluded.text)`)
  }
  await db.execute(sql`
    delete from archive_chunks where collection = ${collection} and doc_id = ${docId}
      and ${part === 'meta' ? sql`position = 0` : sql`position > 0`}
      and (locale, position) not in (select x.locale, x.position from jsonb_to_recordset(${json}::jsonb) as x(locale text, position int))`)
}

async function pageChunks(payload: Payload, collection: string, id: number | string): Promise<SourceChunk[]> {
  const { rows } = await payload.db.drizzle.execute(sql`
    select id, page, text from archive_chunks
    where collection = ${collection} and doc_id = ${String(id)} and position > 0 order by locale, position`)
  return rows.map((r: Doc) => ({ id: Number(r.id), page: r.page, text: r.text }))
}

// Public search reads published chunks only (plan §8.2, §11). A record counts as published while its newest
// version is the published one; a live record with a newer draft (a staff edit or AI output awaiting review)
// drops out of public search until that draft is published, so draft text never leaks.
async function setPublished(payload: Payload, collection: string, id: number | string, published: boolean) {
  await payload.db.drizzle.execute(sql`
    update archive_chunks set published = ${published}
    where collection = ${collection} and doc_id = ${String(id)} and published <> ${published}`)
}

// processing_state / processing_error are written straight to the main row and the newest version row:
// status changes don't create versions or run hooks, and the admin (which shows the newest version) sees them.
async function setState(payload: Payload, collection: string, id: number | string, state: State, error: string | null = null) {
  const db = payload.db.drizzle
  await db.execute(sql`
    update ${sql.identifier(collection)} set processing_state = ${state}, processing_error = ${error}, updated_at = now() where id = ${id}`)
  await db.execute(sql`
    update ${sql.identifier(`_${collection}_v`)} set version_processing_state = ${state}, version_processing_error = ${error}
    where parent_id = ${id} and latest`)
}

// ---- Steps ----

const read = async (payload: Payload, collection: string, id: number | string) =>
  (await payload.findByID({ collection: collection as CollectionSlug, id, draft: true, locale: 'all', depth: 1 })) as Doc

// AI output goes into a new draft version, so nothing AI-written is public until a reviewer publishes it (plan §8.2).
const save = (payload: Payload, collection: string, id: number | string, locale: Locale, data: Doc) =>
  payload.update({ collection: collection as CollectionSlug, id, locale, draft: true, depth: 0, data: data as never, context: { pipeline: true } })

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not read the file ${url} (HTTP ${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

async function pdfPages(url: string): Promise<string[]> {
  const pdf = await getDocumentProxy(new Uint8Array(await download(url)))
  return (await extractText(pdf, { mergePages: false })).text
}

// Page chunks numbered from 1 per locale (position 0 is the record's own text).
function pageRows(pages: string[]): Row[] {
  const next = { en: 1, hi: 1 }
  return chunkPages(cleanPages(pages)).map((c) => ({ locale: c.locale, position: next[c.locale]++, page: c.page, heading: null, text: c.text }))
}

const metadataLines = (pairs: [string, unknown][]) =>
  pairs
    .filter(([, v]) => (Array.isArray(v) ? v.length : v))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n')

const names = (docs: unknown) => (Array.isArray(docs) ? docs.map((d) => first(d?.name ?? d?.title, 'en')).filter(Boolean) : [])

export type PipelineResult = {
  collection: string
  id: number | string
  full: boolean
  state?: State
  chunks: number
  llm: { step: string; model: string; attempts: number; costUsd?: number; raw: string }[]
  dropped?: string[]
  error?: string
}

// full = extract, chunk, AI; otherwise only the record's own text and the published flag are re-indexed.
// An LLM is only called for fields that are still empty, so an already-processed record never costs a call again.
export async function processRecord(payload: Payload, collection: string, id: number | string, full = true): Promise<PipelineResult> {
  const result: PipelineResult = { collection, id, full, chunks: 0, llm: [] }
  const stateful = full && STATEFUL.includes(collection)
  try {
    if (stateful) await setState(payload, collection, id, 'processing')
    let doc = await read(payload, collection, id)
    let state: State = 'ready'

    if (full) {
      const en: Doc = {}
      const hi: Doc = {}
      let aiFilled = false

      if (doc.mimeType === 'application/pdf' && doc.url) {
        const pages = await pdfPages(doc.url)
        if ('page_count' in doc && doc.page_count !== pages.length) en.page_count = pages.length
        if (needsOcr(pages)) state = 'needs_ocr' // no text layer: stop here, no chunks, no summary
        const rows = state === 'ready' ? pageRows(pages) : []
        await writeChunks(payload, collection, id, rows, 'pages')
        result.chunks += rows.length
      }

      const summaryMissing = ['en', 'hi'].some((l) => !first(doc.summary, l as Locale))
      if (collection === 'reports' && state === 'ready' && summaryMissing) {
        const chunks = await pageChunks(payload, collection, id)
        if (chunks.length) {
          const meta = metadataLines([['Title', first(doc.title, 'en')], ['Report type', doc.report_type], ['Year', doc.year], ['Region', doc.region]])
          const call = await summarize(meta, chunks)
          result.llm.push({ step: 'summary', model: call.model, attempts: call.attempts, costUsd: call.costUsd, raw: call.raw })
          result.dropped = call.out.dropped
          if (!first(doc.summary, 'en')) en.summary = call.out.summary_en
          if (!first(doc.summary, 'hi')) hi.summary = call.out.summary_hi
          if (!doc.keywords?.length) en.keywords = call.out.keywords
          aiFilled = true
        }
      }

      const captionMissing = ['caption', 'alt'].some((f) => ['en', 'hi'].some((l) => !first(doc[f], l as Locale)))
      if (collection === 'media' && doc.mimeType?.startsWith('image/') && doc.url && captionMissing) {
        // The 1024 px webp copy is enough for the model and much smaller than the original.
        const large = doc.sizes?.large?.url ? doc.sizes.large : { url: doc.url, mimeType: doc.mimeType }
        const meta = metadataLines([
          ['File name', doc.filename],
          ['Credit', doc.credit],
          ['Region', doc.region],
          ['Stations', names(doc.stations)],
          ['Expedition', names(doc.expedition ? [doc.expedition] : [])],
          ['Existing caption', first(doc.caption, 'en')],
        ])
        const call = await caption(meta, { data: await download(large.url), mimeType: large.mimeType })
        result.llm.push({ step: 'caption', model: call.model, attempts: call.attempts, costUsd: call.costUsd, raw: call.raw })
        const c = call.out
        for (const [field, locale, value, target] of [
          ['caption', 'en', c.caption_en, en],
          ['caption', 'hi', c.caption_hi, hi],
          ['alt', 'en', c.alt_en, en],
          ['alt', 'hi', c.alt_hi, hi],
        ] as const) {
          if (!first(doc[field], locale)) target[field] = value
        }
        if (!doc.tags?.length) en.tags = c.tags
        aiFilled = true
      }

      if (aiFilled && 'ai_generated' in doc) en.ai_generated = true
      if (Object.keys(en).length) await save(payload, collection, id, 'en', en)
      if (Object.keys(hi).length) await save(payload, collection, id, 'hi', hi)
      if (Object.keys(en).length || Object.keys(hi).length) doc = await read(payload, collection, id)
    }

    const meta = metaChunks(collection, doc)
    await writeChunks(payload, collection, id, meta, 'meta')
    result.chunks += meta.length
    await setPublished(payload, collection, id, doc._status === 'published')
    if (stateful) {
      result.state = state
      await setState(payload, collection, id, state)
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e)
    if (stateful) {
      result.state = 'failed'
      await setState(payload, collection, id, 'failed', result.error.slice(0, 2000)).catch(() => {})
    }
  }
  return result
}

// ---- Hooks ----

function schedule(payload: Payload, collection: string, id: number | string, full: boolean) {
  const job = async () => {
    const r = await processRecord(payload, collection, id, full)
    const calls = r.llm.map((c) => `${c.step} ${c.model} x${c.attempts} $${(c.costUsd ?? 0).toFixed(5)}`).join(', ')
    if (r.error) payload.logger.error(`pipeline ${collection}/${id}: ${r.error}`)
    else if (full) payload.logger.info(`pipeline ${collection}/${id}: ${r.state ?? 'indexed'}, ${r.chunks} chunks, LLM: ${calls || 'none'}, ${r.dropped?.length ?? 0} sentences dropped`)
  }
  try {
    // Runs after the response is sent (Vercel keeps the function alive for it, up to its max duration).
    after(job)
  } catch {
    // No request scope (seed scripts, `payload run`): nothing runs in the background there.
    payload.logger.warn(`pipeline ${collection}/${id} not run (no request); run: npm run pipeline:process -- --collection ${collection} --id ${id}`)
  }
}

// Every save re-indexes the record's own text and published flag (so publish/unpublish re-index);
// a new record or a new file also runs extraction and the AI steps.
export const startProcessing: CollectionAfterChangeHook = ({ collection, context, doc, operation, previousDoc, req }) => {
  if (!context.pipeline) {
    const full = operation === 'create' || (doc.filename ?? null) !== (previousDoc?.filename ?? null)
    schedule(req.payload, collection.slug, doc.id, full)
  }
  return doc
}

export const removeChunks: CollectionAfterDeleteHook = async ({ collection, id, req }) => {
  await req.payload.db.drizzle.execute(sql`delete from archive_chunks where collection = ${collection.slug} and doc_id = ${String(id)}`)
}

const SYSTEM_FIELDS = ['processing_state', 'processing_error', 'page_count']
const AI_FIELDS = ['summary', 'keywords', 'caption', 'alt', 'tags']
const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)
const same = (a: unknown, b: unknown) => (isEmpty(a) && isEmpty(b)) || JSON.stringify(a) === JSON.stringify(b)

// Staff saves can't set pipeline-owned fields, and a form opened before processing finished (it still holds
// the empty fields) can't wipe the AI output. A real edit of an AI field clears ai_generated (plan §7).
export const guardPipelineFields: CollectionBeforeChangeHook = ({ context, data, operation, originalDoc }) => {
  if (context.pipeline) return data
  if (operation === 'create' || !originalDoc) return { ...data, processing_state: 'queued', processing_error: null }
  for (const f of SYSTEM_FIELDS) if (f in originalDoc) data[f] = originalDoc[f]
  if ('ai_generated' in originalDoc) {
    if (originalDoc.ai_generated) {
      for (const f of AI_FIELDS) if (f in data && isEmpty(data[f]) && !isEmpty(originalDoc[f])) data[f] = originalDoc[f]
    }
    data.ai_generated = Boolean(originalDoc.ai_generated) && AI_FIELDS.every((f) => !(f in data) || same(data[f], originalDoc[f]))
  }
  return data
}
