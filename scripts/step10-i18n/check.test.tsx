import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'
import { CitationText } from '../../src/components/outreach/CitationText'
import { formatDate, formatNumber, formatYear, pick, translator } from '../../src/i18n'
import { outreachCitations } from '../../src/outreach/citation-data'

const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8'))
const hi = JSON.parse(readFileSync('src/i18n/hi.json', 'utf8'))

test('Hindi dictionary covers every English message and preserves named placeholders', () => {
  assert.deepEqual(Object.keys(hi).sort(), Object.keys(en).sort())
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  for (const key of Object.keys(en)) {
    assert.deepEqual(placeholders(hi[key]), placeholders(en[key]), key)
    // Official platform names, DOI, and the English language switch intentionally remain unchanged.
    if (!['lang.switch', 'platform.x', 'platform.instagram', 'platform.linkedin', 'field.doi'].includes(key)) {
      assert.match(hi[key], /\p{Script=Devanagari}/u, `${key} must contain Hindi UI text`)
    }
  }
})

test('Hindi quantities, calendar years and dates use hi-IN with India timezone', () => {
  assert.equal(formatNumber('hi', 1234567.25), new Intl.NumberFormat('hi-IN').format(1234567.25))
  assert.equal(translator('hi')('archive.results', { count: 1234567 }), `परिणाम: ${new Intl.NumberFormat('hi-IN').format(1234567)}`)
  assert.equal(formatYear('hi', 2026), '2026')
  assert.equal(formatDate('hi', '2026-09-27T18:30:00Z'), new Intl.DateTimeFormat('hi-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(new Date('2026-09-27T18:30:00Z')))
  assert.match(formatDate('hi', '2026-09-27T18:30:00Z'), /28/)
})

test('localized values preserve actual language, including English fallback', () => {
  assert.deepEqual(pick({ en: 'English report', hi: '' }, 'hi'), { value: 'English report', lang: 'en' })
  assert.deepEqual(pick({ en: 'Ice', hi: 'बर्फ़' }, 'hi'), { value: 'बर्फ़', lang: 'hi' })
  assert.deepEqual(pick('English credit', 'hi'), { value: 'English credit', lang: 'en' })
})

test('citations keep Hindi UI labels when an approved post falls back to English', () => {
  const markup = renderToStaticMarkup(<CitationText text="Source fact [c:42]" sources={[{ id: 42, title: 'Report', titleLocale: 'en', recordUrl: '/hi/archive/reports/2', page: 1234, pageUrl: 'https://example.org/report.pdf#page=1234' }]} locale="en" uiLocale="hi" publicStyle />)
  const doc = new JSDOM(markup).window.document
  assert.equal(doc.querySelector('div')?.lang, 'en')
  assert.equal(doc.querySelector('a')?.lang, 'hi')
  assert.equal(doc.querySelector('a')?.getAttribute('aria-label'), translator('hi')('summary.citeLabel', { n: 1, page: 1234 }))
  assert.match(doc.querySelector('a')?.getAttribute('aria-label') ?? '', /1,234/)
})

test('outreach source lookup retains fallback language without weakening public reads', async () => {
  let options: any
  const payload = {
    db: { drizzle: { execute: async () => ({ rows: [{ id: 42, collection: 'reports', doc_id: 2, page: 3 }] }) } },
    find: async (args: any) => { options = args; return { docs: [{ id: 2, title: { en: 'English report', hi: '' }, url: 'https://example.org/report.pdf' }] } },
  } as unknown as Payload
  const sources = await outreachCitations(payload, { source: { relationTo: 'reports', value: 2 }, body: 'Fact [c:42]' }, 'hi')
  assert.equal(options.locale, 'all')
  assert.equal(options.overrideAccess, false)
  assert.equal(options.draft, false)
  assert.equal(sources[0].titleLocale, 'en')
  assert.equal(sources[0].title, 'English report')
  assert.equal(sources[0].recordUrl, '/hi/archive/reports/2')
})
