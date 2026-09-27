// Offline checks for the pipeline's pure logic (no DB, no R2, no LLM). Run: npm run test:pipeline
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseCaption, parseSummary, parseTranslation } from './ai'
import { guardPipelineFields } from './index'
import { chunkPages, cleanPages, groundText, needsOcr } from './text'

const words = (n: number, w = 'ice') => Array.from({ length: n }, () => w).join(' ')

test('needs_ocr when most pages have no text layer', () => {
  assert.equal(needsOcr(['', ' \n ', 'short']), true)
  assert.equal(needsOcr([]), true)
  assert.equal(needsOcr([words(40), '', words(40)]), false)
})

test('cleanPages strips running headers, page numbers, hyphenation and dot leaders', () => {
  const bodies = ['Contents ........ 4\nThe tempera-\nture rose in October-\nNovember.\nMore text.', 'Ice cores.', 'Penguins.', 'Lakes.']
  const pages = bodies.map((b, i) => `ESSO-NCPOR Annual Report 2018-2019${18 + i}\n${b}\n${18 + i}`)
  assert.deepEqual(cleanPages(pages), ['Contents 4\nThe temperature rose in October-November.\nMore text.', 'Ice cores.', 'Penguins.', 'Lakes.'])
})

test('chunks stay on one page, long pages split evenly, Hindi pages get locale hi', () => {
  const chunks = chunkPages([Array.from({ length: 100 }, () => words(10)).join('\n'), 'x', `${words(300, 'हिमनद')}\n`])
  assert.deepEqual(chunks.map((c) => [c.page, c.locale]), [[1, 'en'], [1, 'en'], [3, 'hi']])
  assert.ok(chunks.slice(0, 2).every((c) => c.text.split(' ').length <= 800))
})

test('groundText drops uncited sentences, invalid citations and unmatched numbers', () => {
  const chunks = new Map([
    [7, 'The 43rd expedition leaves in October-November 2023 with 1,00,000 kg of cargo.'],
    [8, 'Bharati station is in the Larsemann Hills.'],
  ])
  const { text, dropped } = groundText(
    'The expedition leaves in 2023 [c:7]. Bharati is in the Larsemann Hills [c:99][c:8]. It carries 100,000 kg [c:7]. It has 44 projects [c:7]. Nobody cited this.',
    chunks,
  )
  assert.equal(text, 'The expedition leaves in 2023 [c:7]. Bharati is in the Larsemann Hills [c:8]. It carries 100,000 kg [c:7].')
  assert.deepEqual(dropped, ['It has 44 projects [c:7].', 'Nobody cited this.'])
  assert.equal(groundText('अभियान २०२३ में जाएगा [c:7]।', chunks).text, 'अभियान २०२३ में जाएगा [c:7]।')
})

test('parseSummary validates schema and language, then grounds', () => {
  const chunks = new Map([[1, 'NCPOR invites proposals for the 43rd expedition.']])
  const ok = parseSummary(
    '```json\n{"summary_en":"NCPOR invites proposals for the 43rd expedition [c:1]. Extra claim.","keywords":["Antarctica","proposals"]}\n```',
    chunks,
  )
  assert.equal(ok.summary_en, 'NCPOR invites proposals for the 43rd expedition [c:1].')
  assert.deepEqual(ok.keywords, ['antarctica', 'proposals'])
  assert.deepEqual(ok.dropped, ['Extra claim.'])
  assert.throws(() => parseSummary('{"summary_en":"एनसीपीओआर प्रस्ताव आमंत्रित करता है [c:1]।","keywords":["x"]}', chunks), /not in English/)
  assert.throws(() => parseSummary('{"summary_en":"a [c:1]."}', chunks), /keywords/)
  assert.throws(() => parseSummary('not json', chunks))
  assert.throws(() => parseSummary('{"summary_en":"No citation here.","keywords":["x"]}', chunks), /valid \[c:/)
})

test('parseTranslation keeps the English citations and numbers', () => {
  const en = 'NCPOR invites proposals for the 43rd expedition [c:1]. It runs in 2023-24 [c:2].'
  const good = 'एनसीपीओआर 43वें अभियान के लिए प्रस्ताव आमंत्रित करता है [c:1]। यह 2023-24 में चलेगा [c:2]।'
  assert.equal(parseTranslation(JSON.stringify({ summary_hi: good }), en), good)
  assert.throws(() => parseTranslation(JSON.stringify({ summary_hi: 'एनसीपीओआर 43वें अभियान के लिए प्रस्ताव [c:1]।' }), en), /cites/)
  assert.throws(() => parseTranslation(JSON.stringify({ summary_hi: 'एनसीपीओआर 44वें अभियान के लिए [c:1]। यह 2023-24 में चलेगा [c:2]।' }), en), /numbers not in the English: 44/)
  assert.throws(() => parseTranslation(JSON.stringify({ summary_hi: en }), en), /not in Hindi/)
})

test('parseCaption checks fields, alt length and Hindi script', () => {
  const good = { caption_en: 'A red station building on rocks.', caption_hi: 'चट्टानों पर एक लाल स्टेशन भवन।', alt_en: 'Red station building', alt_hi: 'लाल स्टेशन भवन', tags: ['Station'] }
  assert.deepEqual(parseCaption(JSON.stringify(good)).tags, ['station'])
  assert.throws(() => parseCaption(JSON.stringify({ ...good, alt_hi: 'Red station building' })), /not in Hindi/)
  assert.throws(() => parseCaption(JSON.stringify({ ...good, alt_en: 'x'.repeat(251) })), /250/)
  assert.throws(() => parseCaption(JSON.stringify({ ...good, tags: [] })), /tags/)
})

test('staff saves keep pipeline fields; a stale form cannot wipe AI output; a real edit clears ai_generated', () => {
  const run = (data: Record<string, unknown>, originalDoc: Record<string, unknown>, context = {}) =>
    guardPipelineFields({ data: { ...data }, originalDoc, operation: 'update', context } as never) as Record<string, unknown>
  const original = { processing_state: 'ready', processing_error: null, page_count: 13, summary: 'AI text [c:1].', keywords: ['ice'], ai_generated: true }

  const stale = run({ processing_state: 'queued', page_count: null, summary: '', keywords: [], ai_generated: false }, original)
  assert.deepEqual(stale, { processing_state: 'ready', processing_error: null, page_count: 13, summary: 'AI text [c:1].', keywords: ['ice'], ai_generated: true })
  assert.equal(run({ summary: 'Written by staff.' }, original).ai_generated, false)
  assert.equal(run({ summary: 'Written by staff.', ai_generated: true }, { ...original, ai_generated: false }).ai_generated, false)
  assert.equal(run({ summary: 'x' }, original, { pipeline: true }).processing_state, undefined)
  const created = guardPipelineFields({ data: { processing_state: 'ready' }, operation: 'create', context: {} } as never) as Record<string, unknown>
  assert.equal(created.processing_state, 'queued')
})
