// No generation, upload or provider calls. Temporarily publish existing step7 test drafts,
// verify the public UI and reviewer boundary, then restore every changed status in finally.
// Run only after step7 finishes: npx payload run scripts/step8/check.ts
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@payload-config'
import { outreachCitations } from '../../src/outreach/citation-data'
import { validQuiz } from '../../src/outreach/presentation'

const base = process.env.APP_BASE_URL || 'http://localhost:3000'
const folder = 'artifacts/step8'
await mkdir(folder, { recursive: true })
const payload = await getPayload({ config })
const manifest = JSON.parse(await readFile('artifacts/step7/live/summary.json', 'utf8'))
assert.deepEqual(manifest.map((r: any) => r.record), [7, 11], 'Requires completed tests on exactly reports 7 and 11')
const users = (await payload.find({ collection: 'users', limit: 100, depth: 0 })).docs
const reviewer = users.find((u) => u.email === 'reviewer@sih63.test')!
const editor = users.find((u) => u.email === 'editor@sih63.test')!
assert.ok(reviewer?.role === 'reviewer' && editor?.role === 'editor')
const postIds = manifest.flatMap((r: any) => r.posts.map((p: any) => p.id))
const posts = (await payload.find({ collection: 'outreach-posts', where: { id: { in: postIds } }, draft: true, pagination: false, depth: 0 })).docs
const selected = [] as typeof posts
for (const language of ['en', 'hi']) {
  const news = posts.find((p) => p.language === language && p.platform === 'linkedin' && p.checks && Object.values(p.checks).every(Boolean))
  assert.ok(news, `A checked ${language} news draft is required`)
  selected.push(news)
  const student = posts.find((p) => p.language === language && p.platform === 'student_explainer' && validQuiz(p.quiz).length === 5 && (p.checks as any)?.schema)
  if (student) selected.push(student)
}
for (const p of selected) assert.ok(p._status === 'draft' && p.review_status === 'pending', 'Never overwrite an already-reviewed post in this check')
const reports = [] as { id: number; main: any; latest: any }[]
for (const id of [7, 11]) reports.push({ id, main: await payload.findByID({ collection: 'reports', id, depth: 0, draft: false }), latest: await payload.findByID({ collection: 'reports', id, depth: 0, draft: true }) })
const chunks = (await payload.db.drizzle.execute(sql`select id, published from archive_chunks where collection = 'reports' and doc_id in ('7','11')`)).rows
await writeFile(`${folder}/restore-state.json`, JSON.stringify({ reports: reports.map((r) => ({ id: r.id, mainStatus: r.main._status, latestStatus: r.latest._status })), posts: selected.map((p) => ({ id: p.id, review_status: p.review_status, _status: p._status, review_note: p.review_note })), chunks }, null, 2))
const results: any[] = []
const changedReports: typeof reports = []
const changedPosts: typeof posts = []
try {
  const draft = selected[0]
  const attempted = await payload.update({ collection: 'outreach-posts', id: draft.id, overrideAccess: false, user: editor, draft: true, data: { review_status: 'approved', review_note: 'Editor must not approve.' } })
  assert.equal(attempted.review_status, 'pending', 'Editor cannot approve')
  results.push({ check: 'editor_cannot_approve', pass: true })
  const anonymousPreview = await fetch(`${base}/api/outreach-preview?id=${draft.id}`)
  assert.equal(anonymousPreview.status, 403)
  results.push({ check: 'anonymous_preview_denied', pass: true })
  for (const record of reports) {
    changedReports.push(record)
    await payload.update({ collection: 'reports', id: record.id, overrideAccess: false, user: reviewer, data: { _status: 'published' }, context: { pipeline: true } })
  }
  await payload.db.drizzle.execute(sql`update archive_chunks set published = true where collection = 'reports' and doc_id in ('7','11')`)
  for (const post of selected) {
    changedPosts.push(post)
    if (post === selected[0]) {
      await assert.rejects(payload.update({ collection: 'outreach-posts', id: post.id, overrideAccess: false, user: reviewer, data: { review_status: 'rejected', review_note: '' }, draft: true }), /review note/i)
      const rejected = await payload.update({ collection: 'outreach-posts', id: post.id, overrideAccess: false, user: reviewer, data: { review_status: 'rejected', review_note: 'Temporary review-flow verification.' }, draft: true })
      assert.equal(rejected.review_status, 'rejected')
      results.push({ check: 'reviewer_reject_requires_note', pass: true })
    }
    const published = await payload.update({ collection: 'outreach-posts', id: post.id, overrideAccess: false, user: reviewer, data: { review_status: 'approved', review_note: 'Temporary UI verification; restored to pending immediately after this check.', _status: 'published' } })
    assert.equal(published.review_status, 'approved')
    const publicPost = (await payload.find({ collection: 'outreach-posts', where: { id: { equals: post.id } }, overrideAccess: false, draft: false, depth: 0 })).docs[0]
    assert.ok(publicPost, 'Approved and published post is readable')
    const sources = await outreachCitations(payload, publicPost, post.language)
    assert.ok(sources.length, 'Published citations resolve')
    const section = post.platform === 'student_explainer' ? 'learn' : 'news'
    const prefix = post.language === 'hi' ? '/hi' : ''
    for (const path of [`${prefix}/${section}`, `${prefix}/${section}/${post.id}`]) {
      const response = await fetch(`${base}${path}`)
      const html = await response.text()
      assert.equal(response.status, 200, path)
      assert.ok(html.includes(`<html lang="${post.language}"`), path)
      if (path.endsWith(`/${post.id}`)) {
        assert.ok(html.includes(sources[0].recordUrl), 'Source record is linked')
        if (sources.some((s) => s.pageUrl)) assert.ok(html.includes('#page='), 'PDF page link rendered')
        if (section === 'learn') assert.ok(html.includes('quiz-0'), 'Five-question browser quiz rendered')
      } else assert.ok(html.includes(`/${section}/${post.id}`), 'Published item is listed')
      await writeFile(`${folder}/${post.language}-${section}-${path.endsWith(`/${post.id}`) ? post.id : 'list'}.html`, html)
      results.push({ check: path, pass: true })
    }
  }
  for (const language of ['en', 'hi']) if (!selected.some((p) => p.language === language && p.platform === 'student_explainer')) results.push({ check: `${language}_live_quiz`, skipped: 'Neither of the two generated records produced a structurally usable five-question quiz in this language; not publishing a diagnostic draft.' })
} finally {
  // Restore posts first while the source is still published. Generation context only resets
  // review metadata; it does not run generation. All selected originals were pending drafts.
  for (const post of [...changedPosts].reverse()) await payload.update({ collection: 'outreach-posts', id: post.id, user: reviewer, data: { _status: 'draft', review_status: 'pending', review_note: post.review_note ?? null }, context: { outreachGeneration: true } })
  for (const record of [...changedReports].reverse()) {
    await payload.update({ collection: 'reports', id: record.id, user: reviewer, data: { _status: record.main._status }, context: { pipeline: true } })
    if (record.latest._status !== record.main._status) await payload.update({ collection: 'reports', id: record.id, user: reviewer, draft: true, data: { _status: record.latest._status }, context: { pipeline: true } })
  }
  for (const chunk of chunks) await payload.db.drizzle.execute(sql`update archive_chunks set published = ${Boolean(chunk.published)} where id = ${Number(chunk.id)}`)
  for (const post of changedPosts) {
    const publicRead = await payload.find({ collection: 'outreach-posts', where: { id: { equals: post.id } }, overrideAccess: false, limit: 1 })
    assert.equal(publicRead.docs.length, 0, 'Restored test draft is private')
  }
  await writeFile(`${folder}/checks.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ checks: results, restored: true, llmCalls: 0 }, null, 2))
}
process.exit(0)
