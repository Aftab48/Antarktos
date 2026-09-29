import test from 'node:test'
import assert from 'node:assert/strict'
import { generateOutreach, type GenerationDependencies, type GenerationResult } from './generate'
import { parseGenerationRequest, requireSameOrigin } from './request'
import { staffRole, guardOutreach } from './access'
import { linkedPhotos } from './store'
import type { GenerationItem } from './types'

const input = parseGenerationRequest({ requestId: '0b7e7d16-b68a-4b25-960b-857c13bc26d1', collection: 'reports', id: 7, platforms: ['x'], languages: ['en', 'hi'] })
const en: GenerationItem = { platform: 'x', language: 'en', title: '', body: 'The station measures ice.', dateline: '', about: '', thread: [], hashtags: [], quiz: [], suggested_media: null, cited_chunk_ids: ['1'], topic: null }
function fixture() {
  const events: string[] = []
  const saved: unknown[] = []
  const deps: GenerationDependencies = {
    reserve: async () => { events.push('reserve'); return null },
    evidence: async () => ({ chunks: [{ id: '1', text: 'The station measures ice.' }], media: [] }),
    saveEvidence: async () => { events.push('evidence') },
    complete: async (language, _evidence, english) => {
      events.push(`call:${language}`)
      if (language === 'hi') assert.deepEqual(english, [en])
      return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ items: [{ ...en, language, body: language === 'hi' ? 'केंद्र बर्फ मापता है।' : en.body }] }) } }] }
    },
    saveRaw: async (language) => { events.push(`raw:${language}`) },
    saveItem: async (item) => { events.push(`draft:${item.item.language}`); saved.push(item); return saved.length },
    finish: async () => { events.push('finish') },
    fail: async () => { events.push('fail') },
  }
  return { events, saved, deps }
}

test('English then Hindi: one call each, durable envelopes precede any draft, pending drafts only', async () => {
  const { deps, events } = fixture()
  const result = await generateOutreach(input, deps)
  assert.equal(result.posts.length, 2)
  assert.deepEqual(events, ['reserve', 'evidence', 'call:en', 'raw:en', 'call:hi', 'raw:hi', 'draft:en', 'draft:hi', 'finish'])
})
test('Hindi-only uses checked English base, persists only Hindi', async () => {
  const { deps, events } = fixture()
  const result = await generateOutreach({ ...input, languages: ['hi'] }, deps)
  assert.equal(result.posts.length, 1)
  assert.equal(result.posts[0].language, 'hi')
  assert.equal(events.filter(e => e.startsWith('call:')).length, 2)
})
test('Completed request replay makes no call and creates no duplicate drafts', async () => {
  const { deps, events } = fixture()
  const result: GenerationResult = { requestId: input.requestId, status: 'complete', posts: [] }
  deps.reserve = async () => result
  assert.equal(await generateOutreach(input, deps), result)
  assert.deepEqual(events, [])
})
test('No source chunks has zero paid calls', async () => {
  const { deps, events } = fixture()
  deps.evidence = async () => ({ chunks: [], media: [] })
  await assert.rejects(generateOutreach(input, deps), /no_source_chunks/)
  assert.deepEqual(events, ['reserve', 'fail'])
})
test('Malformed English is saved as diagnostic drafts and never translated', async () => {
  const { deps, events } = fixture()
  deps.complete = async () => { events.push('call:en'); return { choices: [{ finish_reason: 'stop', message: { content: 'not-json' } }] } }
  const result = await generateOutreach(input, deps)
  assert.equal(result.posts.length, 2)
  assert.ok(result.posts.every(post => !post.checks.schema))
  assert.equal(events.filter(e => e.startsWith('call:')).length, 1)
})
test('Durable raw write failure stops translation and draft saving, without retry', async () => {
  const { deps, events } = fixture()
  deps.saveRaw = async () => { throw new Error('DB unavailable') }
  await assert.rejects(generateOutreach(input, deps), /DB unavailable/)
  assert.deepEqual(events, ['reserve', 'evidence', 'call:en', 'fail'])
})
test('Input and origin guard reject untrusted selections before generation', () => {
  assert.throws(() => parseGenerationRequest({ ...input, collection: 'users' }), /invalid_source/)
  assert.throws(() => parseGenerationRequest({ ...input, model: 'paid-model' }), /invalid_request/)
  assert.throws(() => requireSameOrigin(new Request('http://localhost:3000/api/generate', { headers: { origin: 'https://foreign.example' } })), /invalid_origin/)
  assert.throws(() => requireSameOrigin(new Request('http://localhost:3000/api/generate')), /invalid_origin/)
  assert.equal(staffRole('editor'), true)
  assert.equal(staffRole('reviewer'), true)
  assert.equal(staffRole(undefined), false)
  assert.equal(staffRole('viewer'), false)
})
test('Editor cannot forge checks or approval; content edits reset stale metadata', async () => {
  const before = { title: 'Old title', body: 'Old body', checks: { schema: true }, review_status: 'approved', _status: 'draft', reviewed_by: 2 }
  const result = await guardOutreach({ data: { title: 'Changed', checks: { schema: true }, review_status: 'approved', reviewed_by: 9 }, originalDoc: before, req: { user: { id: 1, role: 'editor' } }, context: {} } as never)
  assert.equal(result.review_status, 'pending')
  assert.equal(result.checks.schema, false)
  assert.equal(result.reviewed_by, null)
  assert.equal(result._status, 'draft')
})
test('Reject requires a note; unpublished approval cannot bypass publish guard', async () => {
  const req = { user: { id: 2, role: 'reviewer' } }
  await assert.rejects(Promise.resolve(guardOutreach({ data: { review_status: 'rejected' }, originalDoc: { review_status: 'pending' }, req, context: {} } as never)), /review note/)
  await assert.rejects(Promise.resolve(guardOutreach({ data: { _status: 'published' }, originalDoc: { review_status: 'pending' }, req, context: {} } as never)), /Approve/)
})
test('Reviewer approval preserves checks across populated relationships and new array row IDs', async () => {
  const quiz = { id: 'old-row', question: 'Which station?', options: ['A', 'B', 'C', 'D'], answer_index: 0, explanation: 'The station is A. [c:1]', chunk_id: 1 }
  const originalDoc = { source: { relationTo: 'reports', value: 7 }, sources: [{ relationTo: 'reports', value: 7 }], suggested_media: 3,
    title: 'Station', body: 'The station measures ice.', about: null, dateline: null, topic: null, hashtags: null,
    thread: [{ id: 'old-thread', text: 'The station measures ice.' }], quiz: [quiz], checks: { schema: true, citations: true }, review_status: 'pending', _status: 'draft' }
  const data = { source: { relationTo: 'reports', value: { id: 7, title: 'Published report' } }, sources: [{ relationTo: 'reports', value: { id: 7 } }],
    suggested_media: { id: '3', alt: 'A station' }, title: originalDoc.title, body: originalDoc.body, about: '', dateline: '', topic: '', hashtags: [],
    thread: [{ id: 'new-thread', text: 'The station measures ice.' }], quiz: [{ ...quiz, id: 'new-row', chunk_id: '1' }], review_status: 'approved', review_note: 'Evidence checked.' }
  const result = await guardOutreach({ data, originalDoc, req: { user: { id: 2, role: 'reviewer' } }, context: {} } as never)
  assert.equal(result.review_status, 'approved')
  assert.deepEqual(result.checks, originalDoc.checks)
  assert.equal(result.reviewed_by, 2)
  assert.equal(result._status, undefined)
})
test('Actual relationship, quiz answer and thread-order edits still clear approval', async () => {
  const originalDoc = { source: { relationTo: 'reports', value: 7 }, suggested_media: 3,
    quiz: [{ id: 'q1', question: 'Which?', options: ['A', 'B', 'C', 'D'], answer_index: 0, explanation: 'A. [c:1]', chunk_id: 1 }],
    thread: [{ text: 'First' }, { text: 'Second' }], checks: { schema: true }, review_status: 'approved', _status: 'draft' }
  const changes = [{ source: { relationTo: 'reports', value: { id: 11 } } }, { source: { relationTo: 'datasets', value: 7 } },
    { suggested_media: { id: 4 } }, { quiz: [{ ...originalDoc.quiz[0], answer_index: 1 }] }, { thread: [...originalDoc.thread].reverse() }]
  for (const data of changes) {
    const result = await guardOutreach({ data, originalDoc, req: { user: { id: 2, role: 'reviewer' } }, context: {} } as never)
    assert.equal(result.review_status, 'pending')
    assert.equal(result.checks.schema, false)
  }
})
test('Suggested photos come only from published images of the record, its stations or its expedition', () => {
  const published = [{ _status: { equals: 'published' } }, { mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] } }]
  const report = linkedPhotos('reports', 28, { stations: [4], expedition: { id: 40 } })
  assert.deepEqual(report, { own: [], where: { and: [{ or: [{ stations: { in: [4] } }, { expedition: { in: [40] } }] }, ...published] } })
  assert.deepEqual(linkedPhotos('events', 3, { media: [9, { id: 10 }], stations: [], expedition: null })?.where, { and: [{ or: [{ id: { in: [9, 10] } }] }, ...published] })
  assert.deepEqual(linkedPhotos('stations', 2, { cover: 9 })?.where, { and: [{ or: [{ id: { in: [9] } }, { stations: { in: [2] } }] }, ...published] })
  assert.deepEqual(linkedPhotos('expeditions', 40, { stations: [4], cover: null })?.where, { and: [{ or: [{ stations: { in: [4] } }, { expedition: { in: [40] } }] }, ...published] })
  assert.deepEqual(linkedPhotos('media', 9, { stations: ['4', -1] })?.where, { and: [{ or: [{ id: { in: [9] } }] }, ...published] })
  assert.equal(linkedPhotos('publications', 5, { stations: [], expedition: null }), null)
})
test('A supplied linked photo survives checks and translation; any other ID is dropped', async () => {
  const { deps, saved } = fixture()
  deps.evidence = async () => ({ chunks: [{ id: '1', text: 'The station measures ice.' }], media: [{ id: 9, caption: 'Maitri station', alt: 'Station buildings', credit: 'A. Photographer' }] })
  const photo = { ...en, platform: 'instagram' as const, suggested_media: '9' }
  deps.complete = async (language) => {
    return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ items: [{ ...photo, language, body: language === 'hi' ? 'केंद्र बर्फ मापता है।' : en.body }] }) } }] }
  }
  await generateOutreach({ ...input, platforms: ['instagram'] }, deps)
  assert.deepEqual(saved.map((s) => (s as { item: GenerationItem }).item.suggested_media), ['9', '9'])
  deps.evidence = async () => ({ chunks: [{ id: '1', text: 'The station measures ice.' }], media: [] })
  saved.length = 0
  await generateOutreach({ ...input, platforms: ['instagram'] }, deps)
  assert.deepEqual(saved.map((s) => (s as { item: GenerationItem }).item.suggested_media), [null, null])
})
