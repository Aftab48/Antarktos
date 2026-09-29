// The demo flow end to end (plan §17 MVP spine): upload a report → processing → publish → generate an outreach
// draft → approve and publish → public post page → ask the archive. Uses the real pipeline and model, so it costs
// a few cents and writes to the configured database: opt in with E2E_FULL_FLOW=1. Staff logins come from
// data/test-users.json (gitignored). Everything it creates is deleted at the end, file in R2 included.
//   E2E_FULL_FLOW=1 npx playwright test tests/e2e/demo-flow.e2e.spec.ts
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { expect, request as http, test, type APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3000'
const USERS = 'data/test-users.json'
// A made-up word, so search and ask can only match this report.
const MARKER = 'Zyloquartz'

test.skip(process.env.E2E_FULL_FLOW !== '1' || !existsSync(USERS), 'opt-in: E2E_FULL_FLOW=1 and data/test-users.json')
test.setTimeout(10 * 60_000)

// A one-page PDF with a real text layer (Helvetica), small enough for any upload limit.
function textPdf(lines: string[]): Buffer {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`)
  const content = `BT /F1 12 Tf 56 780 Td 16 TL ${lines.map((l) => `(${esc(l)}) Tj T*`).join(' ')} ET`
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((body, i) => {
    const at = pdf.length
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
    return at
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

async function staff(role: 'editor' | 'reviewer'): Promise<APIRequestContext> {
  const user = JSON.parse(readFileSync(USERS, 'utf8'))[role]
  // Origin matches the site, as the admin's own requests do (/api/generate refuses anything else).
  const ctx = await http.newContext({ baseURL: BASE, extraHTTPHeaders: { origin: BASE } })
  const res = await ctx.post('/api/users/login', { data: user })
  expect(res.ok(), `${role} login`).toBeTruthy()
  return ctx
}

async function until<T>(label: string, fn: () => Promise<T | undefined>, timeoutMs = 180_000): Promise<T> {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    const value = await fn()
    if (value !== undefined) return value
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error(`timed out waiting for ${label}`)
}

test('upload → process → generate → approve → publish → ask', async ({ page }) => {
  const editor = await staff('editor')
  const reviewer = await staff('reviewer')
  let reportId: number | undefined
  const postIds: number[] = []
  try {
    // 1. Editor uploads a report as a draft; processing starts on save.
    const pdf = textPdf([
      `The ${MARKER} snow survey was carried out at Maitri station in January 2025.`,
      'The field team measured 42 snow stakes along a line of 3 kilometres.',
      'Mean snow accumulation at the stakes was 18 centimetres over the season.',
      'The survey also recorded wind direction twice a day with a hand-held vane.',
      `Results from the ${MARKER} survey will guide the placement of new stakes.`,
    ])
    const created = await editor.post('/api/reports', {
      multipart: {
        file: { name: 'e2e-demo-flow.pdf', mimeType: 'application/pdf', buffer: pdf },
        _payload: JSON.stringify({ title: `E2E test report (${MARKER}) — delete me`, report_type: 'other', region: 'antarctic', year: 2025, license: 'Test fixture', credit: 'Automated test' }),
      },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    reportId = (await created.json()).doc.id

    // 2. The pipeline extracts, indexes and writes a cited summary.
    const report = await until('processing', async () => {
      const doc = await (await editor.get(`/api/reports/${reportId}?draft=true&depth=0&locale=en`)).json()
      if (doc.processing_state === 'failed' || doc.processing_state === 'needs_ocr') throw new Error(`processing ${doc.processing_state}: ${doc.processing_error}`)
      return doc.processing_state === 'ready' ? doc : undefined
    })
    expect(report.summary).toMatch(/\[c:\d+\]/)

    // 3. Reviewer publishes the report; its chunks become publicly searchable.
    expect((await reviewer.patch(`/api/reports/${reportId}`, { data: { _status: 'published' } })).ok()).toBeTruthy()
    await until('public search', async () => {
      const { results } = await (await page.request.get(`${BASE}/api/search?q=${MARKER}`)).json()
      return results?.some((r: { docId: string }) => r.docId === String(reportId)) ? true : undefined
    })

    // 4. Editor generates one English X post from the report; it lands as a pending draft with checks.
    const generated = await editor.post('/api/generate', { data: { requestId: randomUUID(), collection: 'reports', id: reportId, platforms: ['x'], languages: ['en'] } })
    expect(generated.ok(), await generated.text()).toBeTruthy()
    const { posts } = await generated.json()
    postIds.push(...posts.map((p: { id: number }) => p.id))
    expect(posts).toHaveLength(1)
    const draft = await (await reviewer.get(`/api/outreach-posts/${postIds[0]}?draft=true&depth=0`)).json()
    expect(draft.review_status).toBe('pending')
    expect(draft._status).toBe('draft')

    // Not public before approval.
    expect((await page.goto(`${BASE}/news/${postIds[0]}`))?.status()).toBe(404)

    // 5. Reviewer approves and publishes it.
    const approved = await reviewer.patch(`/api/outreach-posts/${postIds[0]}`, { data: { review_status: 'approved', _status: 'published' } })
    expect(approved.ok(), await approved.text()).toBeTruthy()

    // 6. The public post shows its provenance and links back to the report.
    await page.goto(`${BASE}/news/${postIds[0]}`)
    await expect(page.getByText(/Approved by a reviewer on/)).toBeVisible()
    await expect(page.locator(`#outreach-sources a[href="/archive/reports/${reportId}"]`).first()).toBeVisible()
    // Internal review data stays out of the public API.
    const publicPost = await (await page.request.get(`${BASE}/api/outreach-posts/${postIds[0]}`)).json()
    expect(publicPost).not.toHaveProperty('review_note')
    expect(publicPost).not.toHaveProperty('checks')

    // 7. Ask the archive answers from the report, with it as a cited source.
    const ask = await page.request.post(`${BASE}/api/ask`, { data: { question: `How many snow stakes did the ${MARKER} survey measure?`, locale: 'en' } })
    expect(ask.ok(), await ask.text()).toBeTruthy()
    const answer = await ask.json()
    expect(answer.status).toBe('answered')
    expect(answer.sources.some((s: { docId: string }) => s.docId === String(reportId))).toBeTruthy()
  } finally {
    // Clean up: posts first (they reference the report), then the report, its chunks and its R2 file.
    for (const id of postIds) await reviewer.delete(`/api/outreach-posts/${id}`)
    if (reportId) await reviewer.delete(`/api/reports/${reportId}`)
    await editor.dispose()
    await reviewer.dispose()
  }
})
