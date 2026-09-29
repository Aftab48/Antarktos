// Loads data/content/fill.json (gitignored, like data/seed): sourced expedition/event/report links, one Arctic expedition,
// datasets and publications (metadata from Zenodo, PANGAEA, NOAA NCEI and Crossref) and Wikimedia Commons photos.
// Every record carries its source_url, license and credit; photo captions are the Commons descriptions (not AI).
// Idempotent: records are matched by DOI, source URL or title and skipped if present. Published records with a
// pending draft are left alone, so nothing unreviewed goes live.
// Run: npx payload run scripts/content/fill.ts
// Then index (no LLM): npm run pipeline:process -- --collection <datasets|publications|events|expeditions> --all
// Photos: npm run pipeline:process -- --collection media --id <id>  (drafts Hindi captions for review; ~$0.001 each)
import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'

type Row = Record<string, any>
const content = JSON.parse(readFileSync('data/content/fill.json', 'utf8'))
const payload = await getPayload({ config })
const log = (...a: unknown[]) => console.log(...a)

const stationIds = new Map(
  (await payload.find({ collection: 'stations', locale: 'en', pagination: false, depth: 0 })).docs.map((s: Row) => [s.name as string, s.id as number]),
)
const station = (name: string) => {
  const id = stationIds.get(name)
  if (!id) throw new Error(`unknown station ${name}`)
  return id
}
const expeditions = (await payload.find({ collection: 'expeditions', locale: 'en', pagination: false, depth: 0 })).docs as Row[]
const expeditionId = (key: string): number => {
  const [region, number] = key.startsWith('Arctic ') ? ['arctic', key.slice(7)] : ['antarctic', key]
  const doc = expeditions.find((e) => e.region === region && String(e.number) === number)
  if (!doc) throw new Error(`unknown expedition ${key}`)
  return doc.id
}

// Updates a published record in place, unless its newest version is an unpublished draft.
async function link(collection: CollectionSlug, id: number, data: Row) {
  const latest = (await payload.findByID({ collection, id, draft: true, depth: 0 })) as Row
  if (latest._status !== 'published') return log(`skip ${collection} ${id}: newest version is a ${latest._status}`)
  await payload.update({ collection, id, locale: 'en', data: { ...data, _status: 'published' } })
  log(`linked ${collection} ${id}`, JSON.stringify(data))
}

// 1. The Arctic expedition behind report 28.
const ne = content.new_expedition
if (!expeditions.some((e) => e.region === 'arctic' && String(e.number) === ne.number)) {
  const { key: _key, stations, ...rest } = ne
  const doc = await payload.create({ collection: 'expeditions', locale: 'en', data: { ...rest, stations: stations.map(station), _status: 'published' } as any })
  expeditions.push(doc as Row)
  log(`created expedition ${doc.id} ${ne.title}`)
}

// 2. Links on existing records.
for (const e of content.links.expeditions) await link('expeditions', expeditionId(e.number), { stations: e.stations.map(station) })
const events = (await payload.find({ collection: 'events', locale: 'en', pagination: false, depth: 0 })).docs as Row[]
for (const e of content.links.events) {
  const doc = events.find((d) => d.title === e.title)
  if (!doc) throw new Error(`unknown event ${e.title}`)
  await link('events', doc.id, { ...(e.stations && { stations: e.stations.map(station) }), ...(e.expedition && { expedition: expeditionId(e.expedition) }) })
}
for (const r of content.links.reports) await link('reports', r.id, { expedition: expeditionId(r.expedition) })

const TYPES: Record<string, string> = { '.csv': 'text/csv', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

// 3. New records. `match` finds an existing copy so re-runs never duplicate.
async function create(collection: CollectionSlug, rows: Row[], match: (r: Row) => Row, toData: (r: Row) => Row, file?: (r: Row) => string | undefined) {
  for (const row of rows) {
    const found = await payload.find({ collection, where: match(row), draft: true, depth: 0, limit: 1 })
    if (found.totalDocs) {
      log(`exists ${collection} ${found.docs[0].id}`)
      continue
    }
    const path = file?.(row)
    // Explicit type: Payload can't sniff one for plain text (CSV) from the file's bytes.
    const upload = path && { data: readFileSync(path), name: basename(path), mimetype: TYPES[extname(path).toLowerCase()], size: readFileSync(path).length }
    const doc = await payload.create({ collection, locale: 'en', data: { ...toData(row), _status: 'published' } as any, ...(upload && { file: upload }) })
    log(`created ${collection} ${doc.id}`)
  }
}

await create(
  'datasets',
  content.datasets,
  (r) => ({ doi: { equals: r.doi } }),
  ({ file: _file, stations, ...r }) => ({ ...r, stations: (stations ?? []).map(station) }),
  (r) => r.file,
)
await create('publications', content.publications, (r) => ({ doi: { equals: r.doi } }), ({ stations, ...r }) => ({ ...r, stations: stations.map(station) }))
await create(
  'media',
  content.media,
  (r) => ({ source_url: { equals: r.source_url } }),
  ({ file: _file, stations, expedition, ...r }) => ({ ...r, stations: stations.map(station), ...(expedition && { expedition: expeditionId(expedition) }) }),
  (r) => r.file,
)

log('done')
process.exit(0)
