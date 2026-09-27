import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Payload } from 'payload'
import { answerQuestion, RateLimitError, reserveAsk, type AskDependencies, type Completion } from './ask'
import { buildSearchSQL, recordURL } from './database'
import { boundedJson, hashedClientIP, normalizeQuestion, parseSearchFilters, validateAnswer, validateQuestion } from './validation'
import type { AskAnswer, RetrievedChunk } from './types'

const chunk: RetrievedChunk = { chunkId: '17', collection: 'stations', docId: '1', title: 'Bharati', titleLocale: 'en', url: '/stations/1', locale: 'en', page: null, heading: null, snippet: '', rank: 1, region: 'antarctic', year: 2012,
  text: 'Bharati is in Antarctica. It opened in 2012. Researchers study ocean currents. The temperature was -10 degrees.' }
const valid = ['Bharati is in Antarctica [c:17].', 'It opened in 2012 [c:17].']
const raw = (sentences: string[]) => JSON.stringify({ sentences })
const completion = (sentences = valid): Completion => ({ choices: [{ finish_reason: 'stop', message: { content: raw(sentences) } }] })

test('strict bounded question and filters validate before DB or paid calls', () => {
  assert.equal(validateQuestion('  Where\nis Bharati? '), 'Where is Bharati?')
  assert.equal(normalizeQuestion(' ＷHERE   is Bharati? '), 'where is bharati?')
  for (const value of ['', ' ', null, {}, 'x'.repeat(301), 'bad\0data']) assert.throws(() => validateQuestion(value))
  for (const query of ['collection=users', 'locale=fr', 'region=unknown', 'year=1900;drop', 'station=-1', 'page=1001', 'q=' + 'x'.repeat(301)]) assert.throws(() => parseSearchFilters(new URLSearchParams(query)))
  assert.equal(parseSearchFilters(new URLSearchParams('year=2012&station=1')).year, 2012)
})

test('JSON body is bounded even when content-length is missing or false', async () => {
  const request = (body: string) => new Request('http://localhost/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  assert.deepEqual(await boundedJson(request('{"question":"Where?"}')), { question: 'Where?' })
  await assert.rejects(boundedJson(request(' '.repeat(4097))))
  await assert.rejects(boundedJson(request('not JSON')))
})

test('production identity only accepts Vercel-owned IP; local headers cannot evade bucket', () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'production', VERCEL: '1', IP_HASH_SALT: 'test-salt' }
  const ip = (v: string) => new Headers({ 'x-vercel-forwarded-for': v })
  assert.equal(hashedClientIP(ip('2001:db8::1'), env), hashedClientIP(ip('2001:0db8:0:0:0:0:0:1'), env))
  for (const headers of [new Headers(), new Headers({ 'x-forwarded-for': '1.2.3.4' }), ip('1.2.3.4, 2.3.4.5'), ip('unknown')]) assert.throws(() => hashedClientIP(headers, env))
  assert.throws(() => hashedClientIP(ip('1.2.3.4'), { NODE_ENV: 'production', IP_HASH_SALT: 'test' }))
  assert.throws(() => hashedClientIP(ip('1.2.3.4'), { ...env, IP_HASH_SALT: '' }))
  const local: NodeJS.ProcessEnv = { NODE_ENV: 'development', IP_HASH_SALT: 'test' }
  assert.equal(hashedClientIP(ip('1.2.3.4'), local), hashedClientIP(ip('2.3.4.5'), local))
})

test('search uses parameterized filters, best chunk per document and bilingual FTS', () => {
  const injection = "x'); DROP TABLE archive_chunks;--"
  const query = buildSearchSQL({ q: injection, locale: 'hi', collection: 'reports', year: 2024, region: 'antarctic', expedition: 2, station: 1, page: 2 })
  assert.ok(!query.text.includes(injection))
  assert.deepEqual(query.values, [injection, 'reports', 'antarctic', 2024, '2', 1, 12])
  for (const token of ['websearch_to_tsquery', 'ts_rank', 'ts_headline', 'distinct on (collection,doc_id)', 'c.published', "d._status='published'", "'hindi'::regconfig", "'english'::regconfig", 'limit 12']) assert.ok(query.text.includes(token), token)
  assert.match(buildSearchSQL({ q: 'station', locale: 'en', page: 1 }, true).text, /limit 8$/)
  assert.ok(query.text.includes('StartSel="",StopSel=""'))
  assert.equal(recordURL('stations', '1', 'hi'), '/hi/stations/1')
  assert.equal(recordURL('reports', '1', 'en'), '/archive/reports/1')
})

test('schema accepts 2-5 valid sentences and explicit abstention, rejects malformed objects', () => {
  assert.deepEqual(validateAnswer(raw(valid), [chunk], 'en').sentences, valid)
  assert.deepEqual(validateAnswer(raw([]), [chunk], 'en').sentences, [])
  for (const bad of ['null', '[]', '```json\n{}\n```', '{"sentences":"yes"}', '{"sentences":[],"extra":1}', raw(Array(6).fill('x')), raw(['x'.repeat(451)])]) assert.throws(() => validateAnswer(bad, [chunk], 'en'))
})

test('uncited sentences, unknown markers, inline markers and sentence laundering are discarded', () => {
  for (const rejected of [
    'An uncited fact.', 'Invented claim [c:999].', 'Invented claim [c:not-an-id].',
    'Unsupported claim. Bharati is in Antarctica [c:17].',
    'Unsupported claim!Bharati is in Antarctica [c:17].',
    'Bharati [c:17] is in Antarctica.',
  ]) assert.deepEqual(validateAnswer(raw([...valid, rejected]), [chunk], 'en').sentences, valid, rejected)
  const mixed = 'Researchers study ocean currents [c:999][c:17].'
  assert.equal(validateAnswer(raw([...valid, mixed]), [chunk], 'en').sentences[2], 'Researchers study ocean currents [c:17].')
})

test('unbacked numbers and wrong language are discarded; Hindi works with English evidence', () => {
  assert.deepEqual(validateAnswer(raw([...valid, 'It opened in 9999 [c:17].']), [chunk], 'en').sentences, valid)
  assert.deepEqual(validateAnswer(raw(valid), [chunk], 'hi').sentences, [])
  const hi = ['भारती अंटार्कटिका में है [c:17]।', 'यह 2012 में खुला था [c:17]।']
  assert.deepEqual(validateAnswer(raw(hi), [chunk], 'hi').sentences, hi)
  assert.deepEqual(validateAnswer(raw([valid[0], 'Unsupported [c:999].']), [chunk], 'en').sentences, [valid[0]])
})

test('one valid sentence survives alongside a rejected grouped citation', () => {
  const checked = validateAnswer(raw(['Bharati is in Antarctica [c:17, c:999].', valid[1]]), [chunk], 'en')
  assert.deepEqual(checked.sentences, [valid[1]])
  assert.equal(checked.checks.citations, false)
})

function mock(overrides: Partial<AskDependencies> = {}) {
  const calls: string[] = []
  let saved: AskAnswer | undefined
  const deps: AskDependencies = {
    reserve: async () => { calls.push('reserve'); return '1' }, fingerprint: async () => { calls.push('fingerprint'); return 'current' },
    cache: async () => { calls.push('cache'); return null }, retrieve: async () => { calls.push('retrieve'); return [chunk] },
    complete: async () => { calls.push('complete'); return completion() }, saveRaw: async () => { calls.push('raw') },
    saveAnswer: async (_id, answer) => { calls.push('save'); saved = answer }, saveFailure: async () => { calls.push('failure') }, ...overrides,
  }
  return { deps, calls, saved: () => saved }
}

test('zero hits and stopword-only queries return refusal without one LLM call', async () => {
  for (const q of ['How to make tiramisu?', 'Where is it?']) {
    const m = mock({ retrieve: async () => [] })
    const answer = await answerQuestion(q, 'en', m.deps)
    assert.equal(answer.status, 'not_found')
    assert.equal(m.calls.includes('complete'), false)
    assert.equal(m.calls.includes('raw'), false)
    assert.equal(m.saved()?.status, 'not_found')
  }
})

test('one answer call stores raw before validation and final source cards only include cited chunks', async () => {
  const m = mock()
  const answer = await answerQuestion('Where is Bharati?', 'en', m.deps)
  assert.equal(answer.status, 'answered')
  assert.deepEqual(answer.sources.map((s) => s.chunkId), ['17'])
  assert.equal(m.calls.filter((c) => c === 'complete').length, 1)
  assert.ok(m.calls.indexOf('raw') < m.calls.indexOf('save'))
})

test('malformed or truncated output is stored, never retried or exposed', async () => {
  for (const response of [{ choices: [{ finish_reason: 'stop', message: { content: 'bad JSON' } }] }, { choices: [{ finish_reason: 'length', message: { content: raw(valid) } }] }]) {
    const m = mock({ complete: async () => response })
    await assert.rejects(answerQuestion('Where is Bharati?', 'en', m.deps))
    assert.deepEqual(m.calls.slice(-2), ['raw', 'failure'])
    assert.equal(m.saved(), undefined)
  }
})

test('cache hit still consumes rate allowance but avoids retrieval and paid call without sliding TTL', async () => {
  const cached: AskAnswer = { status: 'not_found', locale: 'en', answer: 'Not found in the archive.', sentences: [], sources: [], suggestedSearches: [], cached: false }
  const m = mock({ cache: async () => cached })
  const answer = await answerQuestion('Where is Bharati?', 'en', m.deps)
  assert.equal(answer.cached, true)
  assert.equal(m.calls[0], 'reserve')
  assert.ok(!m.calls.includes('retrieve') && !m.calls.includes('complete') && !m.calls.includes('save'))
})

test('publication/content changes during generation cannot expose or cache stale sources', async () => {
  let n = 0
  const m = mock({ fingerprint: async () => String(++n) })
  await assert.rejects(answerQuestion('Where is Bharati?', 'en', m.deps), /Archive changed/)
  assert.equal(m.saved(), undefined)
  assert.equal(m.calls.at(-1), 'failure')
})

test('rate reservation takes transaction lock before fresh count; excess rolls back', async () => {
  for (const count of [9, 10]) {
    const calls: string[] = []
    const client = { query: async (sql: string) => { calls.push(sql); return { rows: sql.includes('count(*)') ? [{ count }] : [{ id: 1 }] } }, release: () => calls.push('release') }
    const payload = { db: { pool: { connect: async () => client } } } as unknown as Payload
    if (count === 10) await assert.rejects(reserveAsk(payload, 'hash', 'q', 'key'), RateLimitError)
    else assert.equal(await reserveAsk(payload, 'hash', 'q', 'key'), '1')
    assert.equal(calls[0], 'begin')
    assert.match(calls[1], /pg_advisory_xact_lock/)
    assert.match(calls[2], /count\(\*\)/)
    assert.equal(calls.at(-2), count === 10 ? 'rollback' : 'commit')
    assert.equal(calls.at(-1), 'release')
  }
})
