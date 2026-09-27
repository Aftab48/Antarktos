// No model calls/uploads. Source-change checks run in a rolled-back transaction.
// Rate checks insert exactly ten isolated test-log entries, then delete only those entries.
// node --env-file=.env --import tsx scripts/step6/database.mjs
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import pg from 'pg'
import { archiveFingerprint, buildSearchSQL } from '../../src/search/database.ts'
import { reserveAsk, RateLimitError } from '../../src/search/ask.ts'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 12 })
const payload = { db: { pool } }
const testHash = createHash('sha256').update(`step6-rate-${randomUUID()}`).digest('hex')
const checks = []
try {
  const search = async (filters) => (await pool.query(buildSearchSQL({ q: 'station', locale: 'en', page: 1, ...filters }))).rows[0]
  const found = await search({})
  assert.ok(found.total > 0)
  assert.equal(new Set(found.results.map((r) => `${r.collection}:${r.doc_id}`)).size, found.results.length)
  for (let i = 1; i < found.results.length; i++) assert.ok(found.results[i - 1].rank >= found.results[i].rank)
  const filtered = await search({ collection: 'stations', region: 'arctic' })
  assert.ok(filtered.results.length > 0)
  assert.ok(filtered.results.every((r) => r.collection === 'stations' && r.region === 'arctic'))
  const year = await search({ q: '', collection: 'events', year: 2026 })
  assert.ok(year.results.length > 0)
  assert.ok(year.results.every((r) => Number(r.year) === 2026))
  const expedition = await search({ q: '', collection: 'expeditions', expedition: 3 })
  assert.equal(expedition.results.length, 1)
  assert.equal(expedition.results[0].doc_id, '3')
  const station = await search({ q: '', collection: 'stations', station: 4 })
  assert.equal(station.results.length, 1)
  assert.equal(station.results[0].doc_id, '4')
  const beyond = await search({ page: 1000 })
  assert.equal(beyond.total, found.total)
  assert.deepEqual(beyond.results, [])
  checks.push('ranking, one result per document, all filters, pagination');

  const hindi = await pool.query("select to_tsvector('hindi', 'वैज्ञानिकों') @@ websearch_to_tsquery('hindi', 'वैज्ञानिक') as matched")
  assert.equal(hindi.rows[0].matched, true)
  checks.push('Hindi Snowball inflection on Neon');

  const client = await pool.connect()
  try {
    await client.query('begin')
    const transactional = { db: { pool: client } }
    const before = await archiveFingerprint(transactional)
    const id = filtered.results[0].id
    await client.query('update archive_chunks set published=false where id=$1', [id])
    assert.notEqual(await archiveFingerprint(transactional), before)
    const hidden = (await client.query(buildSearchSQL({ q: 'Himadri', locale: 'en', page: 1 }, true))).rows
    assert.ok(hidden.every((r) => String(r.id) !== String(id)))
    await client.query('rollback')
    await client.query('begin')
    await client.query("update archive_chunks set text=text || ' step6-test' where id=$1", [id])
    assert.notEqual(await archiveFingerprint(transactional), before)
    await client.query('rollback')
    assert.equal(await archiveFingerprint(transactional), before)
    checks.push('unpublished chunks excluded; cache fingerprint changes for unpublish and same-ID text edits; source state restored')
  } finally {
    await client.query('rollback')
    client.release()
  }

  const outcomes = await Promise.allSettled(Array.from({ length: 12 }, () => reserveAsk(payload, testHash, 'step6 concurrency fixture', 'step6-test')))
  assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 10)
  const rejected = outcomes.filter((r) => r.status === 'rejected')
  assert.equal(rejected.length, 2)
  assert.ok(rejected.every((r) => r.reason instanceof RateLimitError))
  checks.push('12 simultaneous same-IP reservations: 10 accepted, 2 rate-limited')
  await mkdir('artifacts/step6', { recursive: true })
  await writeFile('artifacts/step6/database-checks.json', JSON.stringify({ at: new Date().toISOString(), checks }, null, 2))
  for (const check of checks) console.log(`ok ${check}`)
} finally {
  await pool.query('delete from ask_log where ip_hash=$1', [testHash])
  await pool.end()
}
