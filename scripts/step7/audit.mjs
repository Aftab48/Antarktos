// Read-only audit of the two saved live-test requests. Never calls a model.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import pg from 'pg'
const folder = 'artifacts/step7/live'
const requests = JSON.parse(await readFile(`${folder}/requests.json`, 'utf8'))
assert.deepEqual(requests.map(r => r.id), [7, 11])
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  const { rows } = await pool.query('select * from outreach_generation_log where request_id=any($1::uuid[]) order by created_at', [requests.map(r => r.requestId)])
  await writeFile(`${folder}/provider-audit.json`, JSON.stringify(rows, null, 2))
  console.log(JSON.stringify(rows.map(r => ({ record: r.request.id, status: r.status, calls: Object.keys(r.raw_responses), model: r.model, drafts: r.result?.posts.length ?? 0,
    results: r.result?.posts.map(p => ({ platform: p.platform, language: p.language, failed: Object.entries(p.checks).filter(([,v]) => !v).map(([k]) => k), issues: p.issues })) })), null, 2))
} finally { await pool.end() }
