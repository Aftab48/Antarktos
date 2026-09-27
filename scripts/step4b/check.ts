// Step-4b security check (no dev server, no LLM call: the model env vars are blanked, so the summary step fails
// before any request). A published report gets a draft PDF whose text layer has a NUL; the job then fails at the
// summary. Checks: the NUL doesn't break indexing, the draft's text never counts as published in archive_chunks,
// and the public can't read processing_error. Uploads two < 1 KB PDFs to R2 and deletes them.
// Run: npm run check:step4b
import assert from 'node:assert/strict'
import { DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'
import { processRecord } from '../../src/pipeline'

process.env.LLM_MODEL_TEXT = ''
process.env.LLM_MODEL_VISION = ''
process.env.OPENROUTER_API_KEY = ''
const payload = await getPayload({ config })

// One-page PDF; with `nul`, a ToUnicode map turns "!" into U+0000 (unpdf passes it through).
function pdf(line: string, nul = false) {
  const cmap = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /X def 1 begincodespacerange <00> <FF> endcodespacerange 1 beginbfchar <21> <0000> endbfchar endcmap CMapName currentdict /CMap defineresource pop end end'
  const content = `BT /F1 12 Tf 10 100 Td (${line}) Tj ET`
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 700 200]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    `<</Type/Font/Subtype/Type1/BaseFont/Helvetica${nul ? '/ToUnicode 6 0 R' : ''}>>`,
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    ...(nul ? [`<</Length ${cmap.length}>>\nstream\n${cmap}\nendstream`] : []),
  ]
  let body = '%PDF-1.4\n'
  const offsets = objs.map((o, i) => {
    const at = body.length
    body += `${i + 1} 0 obj\n${o}\nendobj\n`
    return at
  })
  const xref = body.length
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  body += `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  const data = Buffer.from(body, 'latin1')
  return { data, mimetype: 'application/pdf', name: `step4b-check-${Date.now()}.pdf`, size: data.length }
}

const s3 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
})
const keyOf = (url: string) => decodeURIComponent(new URL(url).pathname.slice(1))
const r2Exists = (Key: string) =>
  s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key })).then(() => true, (e) => (e.$metadata?.httpStatusCode === 404 ? false : Promise.reject(e)))
const pageChunks = async (id: number) =>
  (await payload.db.drizzle.execute(sql`select published, text from archive_chunks
    where collection = 'reports' and doc_id = ${String(id)} and position > 0 order by locale, position`)).rows as { published: boolean; text: string }[]

let passed = 0
async function step(name: string, fn: () => Promise<unknown>) {
  await fn()
  passed++
  console.log(`ok  ${name}`)
}

let id = 0
const keys: string[] = []
try {
  await step('a published report is indexed as published', async () => {
    const doc = await payload.create({
      collection: 'reports',
      data: { title: 'Step 4b check report', summary: 'Staff summary.', _status: 'published' } as never,
      file: pdf('PUBLISHED PAGE TEXT long enough to count as a real text page of this report'),
    })
    id = doc.id as number
    keys.push(keyOf(doc.url!))
    await payload.update({ collection: 'reports', id, locale: 'hi', data: { title: 'चरण 4b जाँच रिपोर्ट', summary: 'कर्मचारी सारांश।' } as never })
    const run = await processRecord(payload, 'reports', id)
    assert.equal(run.error, undefined, run.error)
    // The pipeline saved page_count as a draft; a reviewer publishes it and the publish hook re-indexes.
    await payload.update({ collection: 'reports', id, data: { _status: 'published' } as never })
    await processRecord(payload, 'reports', id, false)
    const rows = await pageChunks(id)
    assert.ok(rows.length && rows.every((r) => r.published && r.text.includes('PUBLISHED PAGE TEXT')), JSON.stringify(rows))
  })

  await step('a draft PDF with a NUL is indexed, and its text stays unpublished when the job fails', async () => {
    const draft = await payload.update({
      collection: 'reports', id, draft: true, data: { summary: '' } as never,
      file: pdf('DRAFT PAGE TEXT from an unreviewed replacement file!it must never reach public search', true),
    })
    keys.push(keyOf(draft.url!))
    const run = await processRecord(payload, 'reports', id)
    assert.equal(run.state, 'failed')
    assert.match(run.error ?? '', /LLM_MODEL_TEXT is not set/) // failed at the summary, after the chunks were written
    const rows = await pageChunks(id)
    assert.ok(rows.length && rows.every((r) => !r.published && r.text.includes('DRAFT PAGE TEXT') && !r.text.includes('\u0000')), JSON.stringify(rows))
    assert.equal((await payload.find({ collection: 'reports', where: { id: { equals: id } }, overrideAccess: false })).totalDocs, 1, 'record still public')
  })

  await step('processing_error is staff-only', async () => {
    const pub = await payload.findByID({ collection: 'reports', id, overrideAccess: false })
    assert.ok(!('processing_error' in pub), 'public read returned processing_error')
    const staff = await payload.findByID({ collection: 'reports', id })
    assert.match(String(staff.processing_error), /LLM_MODEL_TEXT/)
  })
} finally {
  if (id) await payload.delete({ collection: 'reports', id })
  // The draft's file lives only in the versions table, so the delete above doesn't remove it from R2.
  for (const Key of keys) if (await r2Exists(Key)) await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key }))
}
await step('cleanup: record, chunks and both R2 objects are gone', async () => {
  for (const Key of keys) assert.equal(await r2Exists(Key), false, `R2 object ${Key} still there`)
  assert.equal((await pageChunks(id)).length, 0)
})
console.log(`${passed} checks passed`)
process.exit(0)
