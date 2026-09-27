// Re-runs the processing pipeline (plan §7, §15) for one record, e.g. one listed by pipeline:stuck.
// An LLM is only called for AI fields that are still empty, so a processed record costs nothing to re-run.
// Run: npm run pipeline:process -- --collection <c> --id <id>
//      npm run pipeline:process -- --collection <c> --all   (only collections without an LLM step:
//                                                               backfills records saved without a request, e.g. by the seed)
import { parseArgs } from 'node:util'
import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'
import { LLM_COLLECTIONS, processRecord } from '../../src/pipeline'

const PIPELINE_COLLECTIONS = ['reports', 'datasets', 'publications', 'media', 'events', 'expeditions', 'stations']
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { collection: { type: 'string' }, id: { type: 'string' }, all: { type: 'boolean' } },
})
const collection = values.collection ?? ''
if (!PIPELINE_COLLECTIONS.includes(collection) || !(values.id || values.all)) {
  console.error(`Usage: npm run pipeline:process -- --collection <${PIPELINE_COLLECTIONS.join('|')}> (--id <id> | --all)`)
  process.exit(1)
}
if (values.all && LLM_COLLECTIONS.includes(collection)) {
  console.error(`--all is refused for ${collection}: each record can cost an LLM call. Re-run them one --id at a time.`)
  process.exit(1)
}

const payload = await getPayload({ config })
const ids = values.all
  ? (await payload.find({ collection: collection as CollectionSlug, pagination: false, depth: 0 })).docs.map((d) => d.id)
  : [Number(values.id)]

let failed = 0
for (const id of ids) {
  const { llm, ...r } = await processRecord(payload, collection, id)
  if (r.error) failed++
  console.log(JSON.stringify({ ...r, llm: llm.map(({ raw, ...call }) => call) }))
}
console.log(`${ids.length} processed, ${failed} failed`)
if (failed) process.exit(1)
