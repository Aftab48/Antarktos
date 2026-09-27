// Loads data/seed/{stations,expeditions,events}.json into Payload (events only if the file exists).
// Idempotent: a record whose English name/title already exists is skipped, so re-runs never duplicate.
// Seeded records are sourced public facts (source_url + license on each), not AI output, so they
// are created published.
// Run: npx payload run scripts/seed/seed.ts
import { existsSync, readFileSync } from 'node:fs'
import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'

type Row = Record<string, any>
const payload = await getPayload({ config })
const read = (name: string): Row[] | null => {
  const file = `data/seed/${name}.json`
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

// English key → id of every existing record (drafts included).
async function existing(collection: CollectionSlug, key: 'name' | 'title') {
  const { docs } = await payload.find({ collection, locale: 'en', pagination: false, depth: 0, select: { [key]: true } })
  return new Map(docs.map((d: Row) => [d[key] as string, d.id as number]))
}

async function load(collection: CollectionSlug, key: 'name' | 'title', rows: Row[] | null, toData: (r: Row) => Row) {
  if (!rows) return console.log(`${collection}: data/seed/${collection}.json not found, skipped`)
  const ids = await existing(collection, key)
  let created = 0
  for (const row of rows) {
    if (ids.has(row[key])) continue
    const doc = await payload.create({ collection, locale: 'en', data: { ...toData(row), _status: 'published' } as any })
    ids.set(row[key], doc.id as number)
    created++
  }
  console.log(`${collection}: ${created} created, ${rows.length - created} already there`)
  return ids
}

const provenance = (r: Row) => ({ source_url: r.source_url, license: r.license, credit: r.attribution ?? r.credit })

const stationIds = await load('stations', 'name', read('stations'), (r) => ({
  name: r.name,
  region: r.region,
  lat: r.lat,
  lng: r.lng,
  established: r.established,
  decommissioned: r.decommissioned,
  operational_status: r.status,
  description: r.description,
  ...provenance(r),
}))

await load('expeditions', 'title', read('expeditions'), (r) => ({
  title: r.title,
  number: r.number,
  region: r.region,
  season_start: r.season_start,
  season_end: r.season_end,
  leader: r.leader,
  stations: (r.stations ?? []).map((name: string) => stationIds?.get(name)).filter(Boolean),
  summary: r.summary,
  highlights: (r.highlights ?? []).map((text: string) => ({ text })),
  ...provenance(r),
}))

await load('events', 'title', read('events'), (r) => ({
  title: r.title,
  date: r.date,
  event_type: r.event_type,
  description: r.description,
  location: r.location,
  region: r.region,
  ...provenance(r),
}))
