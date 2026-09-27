import type { Payload } from 'payload'
import { COLLECTIONS, type Locale, type RetrievedChunk, type SearchFilters, type SearchResult } from './types'

// Identifiers below are entirely from the collection allowlist, never request text.
const table = (collection: string) => collection.replaceAll('-', '_')
export function publicParents(locale: Locale): string {
  const requested = locale === 'hi' ? 'hi' : 'en'
  const other = requested === 'hi' ? 'en' : 'hi'
  return COLLECTIONS.map((collection) => {
    const name = table(collection)
    const localizedValue = (alias: string) => `coalesce(nullif(to_jsonb(${alias})->>'title',''), nullif(to_jsonb(${alias})->>'name',''), nullif(to_jsonb(${alias})->>'alt',''))`
    const title = `coalesce(${localizedValue('l')}, ${localizedValue('fallback')}, to_jsonb(d)->>'filename', '${collection}')`
    const titleLocale = `case when ${localizedValue('l')} is not null then '${requested}' else '${other}' end`
    const year = `coalesce(to_jsonb(d)->>'year', to_jsonb(d)->>'season_start', to_jsonb(d)->>'established', substring(coalesce(to_jsonb(d)->>'date', to_jsonb(d)->>'taken_at') from 1 for 4))::numeric`
    const stations = collection === 'stations' ? `array[d.id]` : `array(select r.stations_id from ${name}_rels r where r.parent_id=d.id and r.path='stations' and r.stations_id is not null)`
    return `select '${collection}'::text collection, d.id::text doc_id, ${title} title, ${titleLocale} title_locale,
      to_jsonb(d)->>'region' as region, ${year} as year, ${collection === 'expeditions' ? 'd.id::text' : "to_jsonb(d)->>'expedition_id'"} as expedition,
      ${stations} stations, d.updated_at from ${name} d
      left join ${name}_locales l on l._parent_id=d.id and l._locale='${requested}' left join ${name}_locales fallback on fallback._parent_id=d.id and fallback._locale='${other}'
      where d._status='published'`
  }).join('\nunion all\n')
}

export function recordURL(collection: string, id: string, locale: Locale): string {
  const prefix = locale === 'hi' ? '/hi' : ''
  if (collection === 'stations' || collection === 'expeditions') return `${prefix}/${collection}/${encodeURIComponent(id)}`
  return `${prefix}/archive/${collection}/${encodeURIComponent(id)}`
}

type Row = Record<string, unknown>
function result(row: Row, locale: Locale): RetrievedChunk {
  const collection = row.collection as SearchResult['collection']
  const docId = String(row.doc_id)
  return { collection, docId, title: String(row.title), titleLocale: row.title_locale as Locale,
    url: recordURL(collection, docId, locale), locale: row.locale as Locale, chunkId: String(row.id),
    page: row.page == null ? null : Number(row.page), heading: row.heading == null ? null : String(row.heading),
    text: String(row.text ?? ''), snippet: String(row.snippet ?? ''), rank: Number(row.rank),
    region: row.region == null ? null : String(row.region), year: row.year == null ? null : Number(row.year) }
}

export function buildSearchSQL(filters: SearchFilters, chunksOnly = false) {
  const params: unknown[] = [filters.q]
  const bind = (value: unknown) => { params.push(value); return `$${params.length}` }
  const conditions = ['c.published', ...(filters.q ? ['c.tsv @@ query.q'] : [])]
  if (filters.collection) conditions.push(`c.collection=${bind(filters.collection)}`)
  if (filters.region) conditions.push(`p.region=${bind(filters.region)}`)
  if (filters.year) conditions.push(`p.year=${bind(filters.year)}`)
  if (filters.expedition) conditions.push(`p.expedition=${bind(String(filters.expedition))}`)
  if (filters.station) conditions.push(`${bind(filters.station)}=any(p.stations)`)
  const base = `with parents as (${publicParents(filters.locale)}), matches as (
    select c.id,c.collection,c.doc_id,c.locale,c.page,c.heading,c.text,p.title,p.title_locale,p.region,p.year,
      ts_rank(c.tsv,query.q) rank,
      ts_headline(case when c.locale='hi' then 'hindi'::regconfig else 'english'::regconfig end,
        c.text, query.q, 'StartSel="",StopSel="",MaxWords=35,MinWords=12,MaxFragments=1') snippet
    from archive_chunks c join parents p on p.collection=c.collection and p.doc_id=c.doc_id
    cross join lateral (select websearch_to_tsquery(case when c.locale='hi' then 'hindi'::regconfig else 'english'::regconfig end,$1) q) query
    where ${conditions.join(' and ')}
  )`
  if (chunksOnly) return { text: `${base} select * from matches order by rank desc,id asc limit 8`, values: params }
  const offset = bind((filters.page - 1) * 12)
  return { text: `${base}, best as (
    select distinct on (collection,doc_id) * from matches order by collection,doc_id,rank desc,id asc
  ), page_rows as (select * from best order by rank desc,collection,doc_id limit 12 offset ${offset})
  select (select count(*)::int from best) total, coalesce(json_agg(page_rows order by rank desc,collection,doc_id),'[]'::json) results from page_rows`, values: params }
}

export async function searchArchive(payload: Payload, filters: SearchFilters) {
  const { rows } = await payload.db.pool.query(buildSearchSQL(filters))
  return { results: (rows[0].results as Row[]).map((r) => { const { text: _text, ...publicResult } = result(r, filters.locale); return publicResult }), total: Number(rows[0].total), page: filters.page, pageSize: 12 }
}
export async function retrieveChunks(payload: Payload, q: string, locale: Locale): Promise<RetrievedChunk[]> {
  if (!q) return []
  const { rows } = await payload.db.pool.query(buildSearchSQL({ q, locale, page: 1 }, true))
  return rows.map((r: Row) => result(r, locale))
}

// Includes published parent metadata and chunk content, so even a cached refusal is
// invalidated by publish/unpublish, additions, deletions or a same-ID chunk rewrite.
export async function archiveFingerprint(payload: Payload): Promise<string> {
  const { rows } = await payload.db.pool.query(`with parents as (${publicParents('en')})
    select md5(coalesce(string_agg(c.id::text || ':' || md5(json_build_array(c.collection,c.doc_id,c.locale,c.page,c.heading,c.text)::text) || ':' || p.updated_at::text, ',' order by c.id),'')) fingerprint
    from archive_chunks c join parents p on p.collection=c.collection and p.doc_id=c.doc_id where c.published`)
  return rows[0].fingerprint
}
