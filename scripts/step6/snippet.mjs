// Read-only Neon regression for ts_headline option parsing; no model or source writes.
// node --env-file=.env --import tsx scripts/step6/snippet.mjs
import assert from 'node:assert/strict'
import pg from 'pg'
import { buildSearchSQL } from '../../src/search/database.ts'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
try {
  const sample = await pool.query(`select ts_headline('english', 'Himadri is an Arctic research station.',
    websearch_to_tsquery('english','Himadri'), 'StartSel="",StopSel="",MaxWords=35,MinWords=12,MaxFragments=1') snippet`)
  assert.match(sample.rows[0].snippet, /^Himadri is an Arctic research station\.?$/)
  const search = await pool.query(buildSearchSQL({ q: 'Himadri', locale: 'en', page: 1 }))
  assert.ok(search.rows[0].total > 0)
  for (const row of search.rows[0].results) {
    assert.ok(!row.snippet.includes('StopSel='))
    assert.ok(!row.snippet.includes('</b>'))
  }
  console.log(JSON.stringify({ plainSnippet: sample.rows[0].snippet, liveSearchResults: search.rows[0].total, passed: true }))
} finally { await pool.end() }
