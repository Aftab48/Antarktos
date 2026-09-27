// Step-2 check (Payload Local API, access rules enforced with overrideAccess: false):
// roles, publish rules, public reads, localization, review fields, upload guard + storage budget,
// archive_chunks full-text search, seed counts. Uploads one 303-byte PDF to R2 and deletes it.
// Needs: npx payload run scripts/step2/test-users.ts, then npx payload run scripts/seed/seed.ts
// Run:   npx payload run scripts/step2/check.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import { createLocalReq, docAccessOperation, getPayload } from 'payload'

import config from '@payload-config'
import { assertUploadAllowed, storageUsedBytes } from '../../src/storage'

const payload = await getPayload({ config })
const creds = JSON.parse(readFileSync('data/test-users.json', 'utf8'))
const login = async (role: string) => (await payload.login({ collection: 'users', data: creds[role] })).user!
const [admin, editor, reviewer] = [await login('admin'), await login('editor'), await login('reviewer')]
const as = (user: any) => ({ user, overrideAccess: false })
const anon = { overrideAccess: false }

let passed = 0
async function step(name: string, fn: () => Promise<unknown>) {
  await fn()
  passed++
  console.log(`ok  ${name}`)
}
async function rejects(p: Promise<unknown>, statuses: number[], match?: RegExp) {
  try {
    await p
  } catch (e: any) {
    assert.ok(statuses.includes(e.status), `expected status ${statuses}, got ${e.status}: ${e.message}`)
    if (match) assert.match(e.message, match)
    return
  }
  assert.fail(`expected status ${statuses}, but it succeeded`)
}

// Smallest well-formed PDF (Payload checks the %PDF- header, xref and %%EOF).
function tinyPdf(): Buffer {
  const objs = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>', '<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>']
  let body = '%PDF-1.4\n'
  const offsets = objs.map((o, i) => {
    const at = body.length
    body += `${i + 1} 0 obj${o}endobj\n`
    return at
  })
  const xref = body.length
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  body += `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(body, 'latin1')
}

const TITLE = 'Step 2 check report'
const s3 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
})
const r2Exists = (key: string) =>
  s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })).then(() => true, (e) => (e.$metadata?.httpStatusCode === 404 ? false : Promise.reject(e)))
const cleanup = async () => {
  await payload.delete({ collection: 'outreach-posts', where: { body: { equals: 'Step 2 check post' } } })
  await payload.delete({ collection: 'reports', where: { title: { equals: TITLE } } }) // also deletes the R2 object
  await payload.db.drizzle.execute(sql`delete from archive_chunks where doc_id = 'step2-check'; delete from ask_log where ip_hash = 'step2-check'`)
}

await cleanup() // leftovers from an interrupted run
const baseline = await storageUsedBytes(payload)
const pdf = tinyPdf()
let reportId = 0
let objectKey = ''

try {
  await step('roles come from the users collection', async () => {
    assert.deepEqual([admin.role, editor.role, reviewer.role], ['admin', 'editor', 'reviewer'])
  })

  await step('only admins create users; editors cannot promote themselves', async () => {
    await rejects(payload.create({ collection: 'users', data: { email: 'x@sih63.test', password: 'x'.repeat(20), role: 'admin' }, ...as(editor) }), [403])
    const self = await payload.update({ collection: 'users', id: editor.id, data: { role: 'admin' }, ...as(editor) })
    assert.equal(self.role, 'editor')
  })

  await step('the public cannot create a report', async () => {
    await rejects(payload.create({ collection: 'reports', data: { title: TITLE }, draft: true, ...anon }), [403])
  })

  await step('editor creates a draft report with a PDF; the file is in R2 and served from the public R2 URL', async () => {
    const doc = await payload.create({
      collection: 'reports',
      data: { title: TITLE, report_type: 'other', year: 2026 },
      file: { data: pdf, mimetype: 'application/pdf', name: 'step2-check.pdf', size: pdf.length },
      draft: true,
      ...as(editor),
    })
    reportId = doc.id
    assert.equal(doc._status, 'draft')
    assert.equal(doc.filesize, pdf.length)
    assert.ok(doc.url?.startsWith(process.env.R2_PUBLIC_URL!), `url ${doc.url}`)
    objectKey = decodeURIComponent(new URL(doc.url!).pathname.slice(1))
    assert.ok(await r2Exists(objectKey), 'object missing in R2')
    const head = await fetch(doc.url!, { method: 'HEAD' })
    assert.equal(head.status, 200, `public URL HEAD ${head.status}`)
  })

  await step('storage used = baseline + the PDF (summed from the database)', async () => {
    assert.equal((await storageUsedBytes(payload)) - baseline, pdf.length)
  })

  await step('editor cannot publish (create or update); admin UI hides Publish for editors', async () => {
    await rejects(payload.create({ collection: 'reports', data: { title: TITLE, _status: 'published' }, ...as(editor) }), [403])
    await rejects(payload.update({ collection: 'reports', id: reportId, data: { _status: 'published' }, ...as(editor) }), [403])
    const perms = async (user: any) => {
      const req = await createLocalReq({ user }, payload)
      return docAccessOperation({ id: reportId, collection: payload.collections.reports, data: { _status: 'published' }, req })
    }
    assert.ok(!(await perms(editor)).update, 'editor has publish permission')
    assert.ok((await perms(reviewer)).update, 'reviewer lacks publish permission')
  })

  await step('the public cannot see the draft', async () => {
    const { docs } = await payload.find({ collection: 'reports', where: { id: { equals: reportId } }, ...anon })
    assert.equal(docs.length, 0)
    await rejects(payload.findByID({ collection: 'reports', id: reportId, ...anon }), [403, 404])
  })

  await step('Hindi title is stored separately; English stays', async () => {
    await payload.update({ collection: 'reports', id: reportId, locale: 'hi', data: { title: 'चरण 2 जाँच रिपोर्ट' }, draft: true, ...as(editor) })
    const hi = await payload.findByID({ collection: 'reports', id: reportId, locale: 'hi', draft: true, ...as(editor) })
    const en = await payload.findByID({ collection: 'reports', id: reportId, locale: 'en', draft: true, ...as(editor) })
    assert.deepEqual([hi.title, en.title], ['चरण 2 जाँच रिपोर्ट', TITLE])
  })

  await step('reviewer publishes; the public now sees it', async () => {
    const doc = await payload.update({ collection: 'reports', id: reportId, data: { _status: 'published' }, ...as(reviewer) })
    assert.equal(doc._status, 'published')
    const pub = await payload.findByID({ collection: 'reports', id: reportId, ...anon })
    assert.equal(pub.title, TITLE)
    const hi = await payload.findByID({ collection: 'reports', id: reportId, locale: 'hi', ...anon })
    assert.equal(hi.title, 'चरण 2 जाँच रिपोर्ट')
  })

  await step('an editor draft over the published report stays private', async () => {
    await payload.update({ collection: 'reports', id: reportId, data: { title: `${TITLE} (edited)` }, draft: true, ...as(editor) })
    assert.equal((await payload.findByID({ collection: 'reports', id: reportId, ...anon })).title, TITLE)
    assert.equal((await payload.findByID({ collection: 'reports', id: reportId, draft: true, ...as(editor) })).title, `${TITLE} (edited)`)
    // Versions point at the same file: it is still counted once.
    assert.equal((await storageUsedBytes(payload)) - baseline, pdf.length)
  })

  await step('editor cannot delete a published report', async () => {
    await rejects(payload.delete({ collection: 'reports', id: reportId, ...as(editor) }), [403, 404])
  })

  await step('outreach post: only reviewers approve and publish; approval is stamped', async () => {
    const post = await payload.create({
      collection: 'outreach-posts',
      data: { source: { relationTo: 'reports', value: reportId }, platform: 'x', language: 'en', body: 'Step 2 check post', review_status: 'approved' },
      draft: true,
      ...as(editor),
    })
    assert.equal(post.review_status, 'pending')
    assert.ok(!post.reviewed_by)
    await rejects(payload.update({ collection: 'outreach-posts', id: post.id, data: { _status: 'published' }, ...as(editor) }), [403])
    const approved = await payload.update({
      collection: 'outreach-posts',
      id: post.id,
      data: { review_status: 'approved', _status: 'published' },
      ...as(reviewer),
    })
    assert.equal(approved.review_status, 'approved')
    assert.equal(typeof approved.reviewed_by === 'object' ? approved.reviewed_by?.id : approved.reviewed_by, reviewer.id)
    assert.ok(approved.reviewed_at)
    const { docs } = await payload.find({ collection: 'outreach-posts', where: { id: { equals: post.id } }, ...anon })
    assert.equal(docs.length, 1)
  })

  await step('upload guard on the presigned-URL endpoint: login, type, per-type size', async () => {
    const endpoint = payload.config.endpoints.find((e) => e.path === '/storage-s3-generate-signed-url')!
    const sign = async (user: any, body: object) => {
      const req = await createLocalReq({ user }, payload)
      req.json = async () => body
      return endpoint.handler(req)
    }
    const MB = 1024 * 1024
    await rejects(sign(null, { collectionSlug: 'reports', filename: 'a.pdf', mimeType: 'application/pdf', filesize: 1000 }), [403])
    await rejects(sign(editor, { collectionSlug: 'reports', filename: 'a.png', mimeType: 'image/png', filesize: 1000 }), [400], /not allowed/)
    await rejects(sign(editor, { collectionSlug: 'reports', filename: 'a.pdf', mimeType: 'application/pdf', filesize: 50 * MB + 1 }), [400], /too large/)
    await rejects(sign(editor, { collectionSlug: 'media', filename: 'a.jpg', mimeType: 'image/jpeg', filesize: 15 * MB + 1 }), [400], /too large/)
    await rejects(sign(editor, { collectionSlug: 'datasets', filename: 'a.csv', mimeType: 'text/csv', filesize: 100 * MB + 1 }), [400], /too large/)
    await rejects(sign(editor, { collectionSlug: 'expeditions', filename: 'a.pdf', mimeType: 'application/pdf', filesize: 1000 }), [400])
    // Allowed: a URL is signed locally (no R2 request), with Content-Length bound into the signature.
    const res = await sign(editor, { collectionSlug: 'media', filename: 'clip.mp4', mimeType: 'video/mp4', filesize: 90 * MB })
    assert.equal(res.status, 200)
    const { url } = await res.json()
    assert.match(new URL(url).searchParams.get('X-Amz-SignedHeaders') ?? '', /content-length/)
  })

  await step('storage budget: an upload that would pass the budget is refused', async () => {
    const used = await storageUsedBytes(payload)
    await rejects(assertUploadAllowed(payload, 'reports', 'application/pdf', 1000, used + 999), [400], /Storage budget reached/)
    await assertUploadAllowed(payload, 'reports', 'application/pdf', 1000, used + 1000)
  })

  await step('server-side uploads get the same size limit (nothing reaches R2)', async () => {
    const big = Buffer.concat([pdf.subarray(0, 9), Buffer.alloc(50 * 1024 * 1024), pdf.subarray(9)])
    await rejects(
      payload.create({
        collection: 'reports',
        data: { title: TITLE },
        file: { data: big, mimetype: 'application/pdf', name: 'step2-too-big.pdf', size: big.length },
        draft: true,
        ...as(editor),
      }),
      [400],
      /too large/,
    )
  })

  await step('archive_chunks: generated tsvector column + GIN index, english and simple configs', async () => {
    const q = async (query: ReturnType<typeof sql>) => (await payload.db.drizzle.execute(query)).rows as any[]
    const [col] = await q(sql`select attgenerated from pg_attribute where attrelid = 'archive_chunks'::regclass and attname = 'tsv'`)
    assert.equal(col.attgenerated, 's')
    const idx = await q(sql`select indexdef from pg_indexes where tablename = 'archive_chunks'`)
    assert.ok(idx.some((i) => /gin \(tsv\)/i.test(i.indexdef)))
    await q(sql`insert into archive_chunks (collection, doc_id, locale, position, page, heading, text) values
      ('reports', 'step2-check', 'en', 0, 3, 'Glaciology', 'Scientists measured the retreating glaciers near Himadri.'),
      ('reports', 'step2-check', 'hi', 0, 3, null, 'वैज्ञानिकों ने हिमाद्री के पास हिमनद मापे।')`)
    const en = await q(sql`select id from archive_chunks where doc_id = 'step2-check' and tsv @@ websearch_to_tsquery('english', 'glacier retreat')`)
    const hi = await q(sql`select id from archive_chunks where doc_id = 'step2-check' and tsv @@ websearch_to_tsquery('hindi', 'हिमाद्री')`)
    assert.deepEqual([en.length, hi.length], [1, 1])
    await q(sql`insert into ask_log (ip_hash, question, answer) values ('step2-check', 'q', '{"a":1}')`)
    assert.equal((await q(sql`select count(*)::int as n from ask_log where ip_hash = 'step2-check'`))[0].n, 1)
  })

  await step('seed: stations and expeditions loaded once, published', async () => {
    for (const [collection, key, file] of [['stations', 'name', 'stations'], ['expeditions', 'title', 'expeditions']] as const) {
      const expected = JSON.parse(readFileSync(`data/seed/${file}.json`, 'utf8')).length
      const { docs } = await payload.find({ collection, pagination: false, depth: 0, ...anon })
      assert.equal(docs.length, expected, `${collection}: ${docs.length} public, expected ${expected}`)
      assert.equal(new Set(docs.map((d: any) => d[key])).size, expected, `${collection}: duplicate ${key}`)
    }
    const hi = await payload.find({ collection: 'stations', locale: 'hi', pagination: false, ...anon })
    assert.ok(hi.docs.some((d) => d.name === 'Maitri'), 'Hindi falls back to English until translated')
  })
} finally {
  await cleanup()
}

assert.equal(await r2Exists(objectKey), false, 'R2 object still there after delete')
assert.equal(await storageUsedBytes(payload), baseline)
console.log(`\nall ${passed} checks passed; test report, post, chunks and R2 object deleted`)
