import { sql } from '@payloadcms/db-postgres'
import type { Payload, TypedUser } from 'payload'
import { href, type Locale } from '../i18n'
import { sourceRecordPath, type CitationSource } from './presentation'

const collections = ['reports', 'datasets', 'publications', 'media', 'events', 'stations', 'expeditions'] as const
type SourceCollection = (typeof collections)[number]
type Post = Record<string, any>

// Only citations from this post's own source relationships can be resolved. Every related record
// is loaded with Payload access enabled, including public reads where no user is provided.
export async function outreachCitations(payload: Payload, post: Post, locale: Locale, user?: TypedUser): Promise<CitationSource[]> {
  const relationships = [post.source, ...(Array.isArray(post.sources) ? post.sources : [])]
  const allowed = new Set(relationships.filter(Boolean).map((r) => `${r.relationTo}:${typeof r.value === 'object' ? r.value?.id : r.value}`))
  const ids = [...new Set([
    ...(Array.isArray(post.cited_chunk_ids) ? post.cited_chunk_ids : []),
    ...(Array.isArray(post.quiz) ? post.quiz.map((q: Post) => q.chunk_id) : []),
    ...[post.body, post.title, post.dateline, post.about, ...(post.thread ?? []).map((v: Post) => v.text)].flatMap((s) => typeof s === 'string' ? [...s.matchAll(/\[c:(\d+)\]/g)].map((m) => Number(m[1])) : []),
  ])].filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0).slice(0, 100)
  if (!ids.length) return []
  const { rows } = await payload.db.drizzle.execute(sql`select id, collection, doc_id, page from archive_chunks
    where id = any(string_to_array(${ids.join(',')}, ',')::bigint[]) and (${Boolean(user)} or published) order by id`)
  const docs = new Map<string, Post | null>()
  const result: CitationSource[] = []
  for (const row of rows) {
    const collection = String(row.collection) as SourceCollection
    const key = `${collection}:${row.doc_id}`
    if (!collections.includes(collection) || !allowed.has(key)) continue
    if (!docs.has(key)) {
      const found = await payload.find({ collection, where: { id: { equals: Number(row.doc_id) } }, limit: 1, depth: 0, locale, draft: Boolean(user), overrideAccess: false, user })
      docs.set(key, found.docs[0] ?? null)
    }
    const doc = docs.get(key)
    if (!doc) continue
    const title = doc.title || doc.name || doc.caption || doc.alt || `${collection} ${doc.id}`
    const page = row.page == null ? null : Number(row.page)
    const url = typeof doc.url === 'string' && /^https?:\/\//.test(doc.url) ? doc.url : undefined
    result.push({ id: Number(row.id), title: String(title), page, recordUrl: user ? `/admin/collections/${collection}/${doc.id}` : href(locale, sourceRecordPath(collection, doc.id)), ...(page && url ? { pageUrl: `${url}#page=${page}` } : {}) })
  }
  return result
}
