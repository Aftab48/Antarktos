// Six bounded questions against the current public archive. No uploads or content changes.
// Run with the dev server: node --env-file=.env scripts/step6/live.mjs
// At most six answer calls; current English-only archive needs three. No retries.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.APP_BASE_URL || 'http://localhost:3000'
const folder = `artifacts/step6/live-${new Date().toISOString().replace(/[:.]/g, '-')}`
await mkdir(folder, { recursive: true })
const cases = [
  { locale: 'en', question: 'Where is Himadri and what does it study?', expected: 'answered' },
  { locale: 'en', question: 'Where is Bharati and what research does it support?', expected: 'answered' },
  { locale: 'en', question: 'What is the recipe for tiramisu?', expected: 'not_found' },
  { locale: 'hi', question: 'Himadri कहाँ है और वहाँ किसका अध्ययन होता है?', expected: 'answered' },
  { locale: 'hi', question: 'भारती कहाँ है और वहाँ कौन सा शोध होता है?' },
  { locale: 'hi', question: 'तिरामिसू बनाने की विधि क्या है?', expected: 'not_found' },
]

async function request(path, init, name) {
  const response = await fetch(base + path, init)
  const raw = await response.text()
  await writeFile(`${folder}/${name}.json`, JSON.stringify({ status: response.status, body: raw }, null, 2))
  return { response, body: JSON.parse(raw) }
}

const search = await request('/api/search?q=station&locale=en', undefined, 'search')
assert.equal(search.response.status, 200)
assert.ok(search.body.results.length > 0)
assert.equal(new Set(search.body.results.map((r) => `${r.collection}:${r.docId}`)).size, search.body.results.length)
assert.ok(search.body.results.every((r) => typeof r.snippet === 'string' && r.snippet.length > 0))
const filtered = await request('/api/search?q=station&locale=en&collection=stations&region=arctic', undefined, 'search-filtered')
assert.equal(filtered.response.status, 200)
assert.ok(filtered.body.results.length > 0)
assert.ok(filtered.body.results.every((r) => r.collection === 'stations' && r.region === 'arctic'))

const results = []
for (const [index, item] of cases.entries()) {
  const started = Date.now()
  const { response, body } = await request('/api/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: item.question, locale: item.locale }),
  }, `question-${index + 1}-${item.locale}`)
  assert.equal(response.status, 200, JSON.stringify(body))
  assert.equal(body.locale, item.locale)
  if (item.expected) assert.equal(body.status, item.expected, item.question)
  if (body.status === 'answered') {
    assert.ok(body.sentences.length >= 1 && body.sentences.length <= 5)
    const ids = new Set(body.sources.map((s) => String(s.chunkId)))
    for (const sentence of body.sentences) {
      const citations = [...sentence.matchAll(/\[c:(\d+)\]/g)]
      assert.ok(citations.length > 0)
      assert.ok(citations.every((c) => ids.has(c[1])))
    }
    if (item.locale === 'hi') assert.match(body.answer, /[\u0900-\u097f]/)
  } else {
    assert.equal(body.status, 'not_found')
    assert.deepEqual(body.sources, [])
    assert.ok(body.suggestedSearches.length > 0)
  }
  results.push({ ...item, actual: body.status, cached: body.cached, milliseconds: Date.now() - started, answer: body.answer })
  console.log(`${index + 1}. ${item.locale}: ${body.status} (${body.cached ? 'cache' : 'fresh'})`)
}

const repeat = await request('/api/ask', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: cases[0].locale, question: `  ${cases[0].question.toUpperCase()}  ` }),
}, 'cache-repeat')
assert.equal(repeat.response.status, 200)
assert.equal(repeat.body.cached, true, 'normalized repeated question should use 24h cache')

const tooLong = await request('/api/ask', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'x'.repeat(301) }),
}, 'length-cap')
assert.equal(tooLong.response.status, 400)

await writeFile(`${folder}/summary.json`, JSON.stringify({ base, results, checks: ['search', 'one-per-document', 'filters', 'six-questions', 'citation-ids', 'cache', 'length-cap'] }, null, 2))
console.log(`Passed; raw responses saved to ${folder}`)
