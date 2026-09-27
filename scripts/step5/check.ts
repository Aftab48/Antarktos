// Step-5 check (plan §5, §15 public pages) against the running dev server.
// 1. Key pages in English and Hindi: HTTP 200, <html lang>, a language toggle to the same page, 404s for drafts.
// 2. The demo path, home -> expedition -> report -> original PDF, in both languages. The public site only shows
//    published records and every report is a draft, so the check publishes one AI-summarised draft report linked
//    to an expedition (and one draft photo linked to a station) as the reviewer through the Local API, follows
//    the path, then puts both back to draft. `--keep` leaves them published.
// 3. The Payload admin still gets no Tailwind CSS.
// Needs: npm run dev, npm run users:test. No LLM call, no upload; one HEAD request to the PDF on R2.
// Run: npm run check:step5            (restores the drafts at the end)
//      npm run check:step5 -- --keep  (leaves them published)
import assert from 'node:assert/strict'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'
import en from '../../src/i18n/en.json'
import hi from '../../src/i18n/hi.json'
import { citedIds, stripMarkers } from '../../src/pipeline/text'

type Doc = Record<string, any>
const BASE = process.env.APP_BASE_URL || 'http://localhost:3000'
const keep = process.argv.includes('--keep')
const payload = await getPayload({ config })

let passed = 0
async function step(name: string, fn: () => Promise<unknown>) {
  await fn()
  passed++
  console.log(`ok  ${name}`)
}

async function get(path: string, status = 200) {
  const res = await fetch(BASE + path, { redirect: 'manual' })
  const html = await res.text()
  assert.equal(res.status, status, `${path}: HTTP ${res.status}, expected ${status}`)
  return html
}
const htmlLang = (html: string) => html.match(/<html[^>]*\slang="([^"]+)"/)?.[1]
const hi_ = (path: string) => (path === '/' ? '/hi' : `/hi${path}`)
// Visible text only (no <script> flight data), to look for leaked markers or draft text.
const visible = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

async function page(path: string, l: 'en' | 'hi') {
  const url = l === 'hi' ? hi_(path) : path
  const html = await get(url)
  assert.equal(htmlLang(html), l, `${url}: <html lang>`)
  const other = l === 'en' ? hi_(path) : path
  assert.match(html, new RegExp(`<a href="${esc(other).replace(/[?]/g, '\\?')}" hrefLang="${l === 'en' ? 'hi' : 'en'}"`, 'i'), `${url}: toggle to ${other}`)
  assert.ok(!/\[c:\d+\]/.test(visible(html)), `${url}: raw [c:id] marker`)
  return html
}

// ---- 0. Dictionaries ----

await step('en.json and hi.json have the same keys, none empty', async () => {
  assert.deepEqual(Object.keys(hi).sort(), Object.keys(en).sort())
  for (const [k, v] of [...Object.entries(en), ...Object.entries(hi)]) assert.ok(v.trim(), `empty string ${k}`)
})

// ---- 1. Key pages ----

const firstId = async (collection: 'expeditions' | 'stations' | 'events') =>
  (await payload.find({ collection, overrideAccess: false, depth: 0, limit: 1, sort: 'id' })).docs[0]?.id
const [expId, stationId, eventId] = await Promise.all([firstId('expeditions'), firstId('stations'), firstId('events')])
const pages = ['/', '/expeditions', `/expeditions/${expId}`, '/stations', `/stations/${stationId}`, '/archive', '/archive?type=events', `/archive/events/${eventId}`, '/about']

await step(`${pages.length} key pages in English and Hindi: 200, lang, toggle`, async () => {
  for (const p of pages) for (const l of ['en', 'hi'] as const) await page(p, l)
})

await step('Hindi page with English-only content marks it lang="en"', async () => {
  const html = await page(`/stations/${stationId}`, 'hi')
  assert.match(html, /<h1[^>]*lang="en"/, 'station name falls back to English')
  assert.ok(html.includes(hi['lang.fallback']), 'fallback notice')
})

await step('unknown paths are 404, /en/… redirects to /…', async () => {
  await get('/no-such-page', 404)
  await get('/hi/no-such-page', 404)
  await get('/archive/reports/999999999', 404)
  await get('/archive/nonsense/1', 404)
  const res = await fetch(`${BASE}/en/stations`, { redirect: 'manual' })
  assert.equal(res.status, 307)
  assert.equal(new URL(res.headers.get('location')!, BASE).pathname, '/stations')
})

// ---- 2. Drafts stay private; the demo path once published ----

const draftReport = (
  await payload.find({
    collection: 'reports',
    draft: true,
    locale: 'en',
    depth: 0,
    limit: 1,
    sort: '-id',
    where: { and: [{ expedition: { exists: true } }, { summary: { like: '[c:' } }] },
  })
).docs[0] as Doc | undefined
assert.ok(draftReport, 'no report with an expedition and a cited summary: upload one and let the pipeline run')
const draftPhoto = (
  await payload.find({ collection: 'media', draft: true, depth: 0, limit: 1, sort: 'id', where: { stations: { exists: true } } })
).docs[0] as Doc | undefined
const reviewer = (await payload.find({ collection: 'users', where: { email: { equals: 'reviewer@sih63.test' } }, limit: 1 })).docs[0]
assert.ok(reviewer, 'reviewer@sih63.test missing: run npm run users:test')

const rid = draftReport.id as number
const published = new Set<string>()
const isPublic = async (collection: 'reports' | 'media', id: number) =>
  (await payload.count({ collection, overrideAccess: false, where: { id: { equals: id } } })).totalDocs > 0
const setStatus = (collection: 'reports' | 'media', id: number, _status: 'draft' | 'published') =>
  payload.update({ collection, id, data: { _status } as never, user: reviewer, overrideAccess: false })

try {
  if (!(await isPublic('reports', rid))) {
    await step(`draft report ${rid} is not public`, async () => {
      await get(`/archive/reports/${rid}`, 404)
      await get(hi_(`/archive/reports/${rid}`), 404)
      const list = visible(await get('/archive?type=reports'))
      assert.ok(!list.includes(stripMarkers(draftReport.summary).slice(0, 40)), 'draft summary on /archive')
      assert.ok(!(await get(`/expeditions/${draftReport.expedition}`)).includes(`/archive/reports/${rid}"`), 'draft linked from its expedition')
    })
    await setStatus('reports', rid, 'published')
    published.add(`reports/${rid}`)
    console.log(`    published report ${rid} as the reviewer (Local API)`)
  }
  if (draftPhoto && !(await isPublic('media', draftPhoto.id))) {
    await get(`/archive/media/${draftPhoto.id}`, 404)
    await setStatus('media', draftPhoto.id, 'published')
    published.add(`media/${draftPhoto.id}`)
    console.log(`    published photo ${draftPhoto.id} as the reviewer (Local API)`)
  }

  const report = (await payload.findByID({ collection: 'reports', id: rid, locale: 'all', depth: 0 })) as Doc
  const expedition = report.expedition as number
  const pdf = report.url as string
  const { rows } = await payload.db.drizzle.execute(sql`
    select id, page from archive_chunks where collection = 'reports' and doc_id = ${String(rid)} and position > 0`)
  const pageOf = new Map(rows.map((r: Doc) => [Number(r.id), r.page as number]))

  for (const l of ['en', 'hi'] as const) {
    const at = (p: string) => (l === 'hi' ? hi_(p) : p)
    await step(`${l}: home -> expedition ${expedition} -> report ${rid} -> PDF page`, async () => {
      assert.ok((await page('/', l)).includes(`href="${at(`/expeditions/${expedition}`)}"`), 'home links the featured expedition')
      assert.ok((await page(`/expeditions/${expedition}`, l)).includes(`href="${at(`/archive/reports/${rid}`)}"`), 'expedition links its report')
      const html = await page(`/archive/reports/${rid}`, l)
      assert.ok(html.includes(`href="${esc(pdf)}"`), 'link to the original PDF')
      const summary = report.summary[l] as string
      const cited = citedIds(summary).filter((id) => pageOf.has(id))
      assert.ok(cited.length, `${l} summary cites this report's chunks`)
      assert.ok(html.includes(`href="${esc(pdf)}#page=${pageOf.get(cited[0])}"`), 'first citation links its PDF page')
      assert.ok(visible(html).includes(summary.split(/\s*\[c:/)[0].slice(0, 30)), `${l} summary text shown`)
      if (l === 'hi' && !report.title.hi) assert.match(html, /<h1[^>]*lang="en"/, 'English title marked lang="en"')
    })
  }

  await step('the original PDF is reachable on R2', async () => {
    const res = await fetch(pdf, { method: 'HEAD' })
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type') ?? '', /pdf/i)
  })

  if (draftPhoto) {
    const photo = (await payload.findByID({ collection: 'media', id: draftPhoto.id, locale: 'all', depth: 0 })) as Doc
    const station = photo.stations[0]
    await step(`station ${station} shows photo ${photo.id} with its alt text in each language`, async () => {
      for (const l of ['en', 'hi'] as const) {
        const html = await page(`/stations/${station}`, l)
        const alt = photo.alt[l] ?? photo.alt.en
        assert.ok(html.includes(`alt="${esc(alt)}"`), `${l} alt text`)
      }
    })
  }
} finally {
  if (!keep)
    for (const key of published) {
      const [collection, id] = key.split('/') as ['reports' | 'media', string]
      await setStatus(collection, Number(id), 'draft')
      assert.equal(await isPublic(collection, Number(id)), false)
      await get(`/archive/${key}`, 404)
      console.log(`    ${key} back to draft`)
    }
}

// ---- 3. Admin untouched ----

await step('/admin renders and its CSS has no Tailwind', async () => {
  const html = await get('/admin/login')
  const css = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1])
  assert.ok(css.length, 'admin stylesheet')
  for (const href of css) assert.ok(!/tailwindcss|--tw-/.test(await (await fetch(BASE + href)).text()), `${href} contains Tailwind`)
})

console.log(`\n${passed} checks passed${keep && published.size ? ` (left published: ${[...published].join(', ')})` : ''}`)
process.exit(0)
