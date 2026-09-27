// Exactly two existing source records; at most one EN + one HI call per record.
// Durable request IDs allow a repeated script run to replay, not regenerate.
// Start the dev server, then: node --env-file=.env scripts/step7/live.mjs
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const base = process.env.APP_BASE_URL || 'http://localhost:3000'
const folder = 'artifacts/step7/live'
await mkdir(folder, { recursive: true })
const platforms = ['blog', 'x', 'instagram', 'linkedin', 'press_note', 'student_explainer']
let manifest
try { manifest = JSON.parse(await readFile(`${folder}/requests.json`, 'utf8')) }
catch (error) {
  if (error.code !== 'ENOENT') throw error
  manifest = [7, 11].map((id) => ({ requestId: randomUUID(), collection: 'reports', id, platforms, languages: ['en', 'hi'] }))
  await writeFile(`${folder}/requests.json`, JSON.stringify(manifest, null, 2))
}
assert.deepEqual(manifest.map((r) => r.id), [7, 11], 'Only the two authorized records may be tested')
assert.ok(manifest.every((r) => r.collection === 'reports'))

const users = JSON.parse(await readFile('data/test-users.json', 'utf8'))
const login = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(users.editor) })
assert.equal(login.status, 200, 'Existing editor test login')
const { token } = await login.json()
assert.ok(token)
const headers = { 'Content-Type': 'application/json', Authorization: `JWT ${token}`, Origin: base }

const denied = await fetch(`${base}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manifest[0]) })
assert.ok([401, 403].includes(denied.status), `Anonymous generation must be refused: ${denied.status}`)

const summary = []
for (const request of manifest) {
  console.log(`Generating/replaying report ${request.id}: six platforms, English then Hindi`)
  const started = Date.now()
  const response = await fetch(`${base}/api/generate`, { method: 'POST', headers, body: JSON.stringify(request) })
  const text = await response.text()
  await writeFile(`${folder}/report-${request.id}-response.json`, JSON.stringify({ status: response.status, milliseconds: Date.now() - started, body: text }, null, 2))
  assert.equal(response.status, 200, text)
  const body = JSON.parse(text)
  assert.equal(body.status, 'complete')
  assert.equal(body.posts.length, 12)
  assert.equal(new Set(body.posts.map((p) => `${p.platform}:${p.language}`)).size, 12)
  const docs = []
  for (const post of body.posts) {
    const read = await fetch(`${base}/api/outreach-posts/${post.id}?draft=true&depth=0`, { headers })
    assert.equal(read.status, 200)
    const doc = await read.json()
    assert.equal(doc._status, 'draft')
    assert.equal(doc.review_status, 'pending')
    assert.ok(doc.model && doc.prompt_version)
    assert.ok(doc.checks && typeof doc.checks === 'object')
    docs.push(doc)
    const publicRead = await fetch(`${base}/api/outreach-posts/${post.id}`)
    assert.ok([403, 404].includes(publicRead.status), `Draft ${post.id} must not be public`)
  }
  await writeFile(`${folder}/report-${request.id}-drafts.json`, JSON.stringify(docs, null, 2))
  summary.push({ record: request.id, requestId: request.requestId, posts: body.posts, milliseconds: Date.now() - started })
  await writeFile(`${folder}/summary.json`, JSON.stringify(summary, null, 2))
  console.log(`Report ${request.id}: twelve saved drafts; all private`)
}

// Repeat the exact first request to verify that timeouts/repeated clicks do not spend again.
const replay = await fetch(`${base}/api/generate`, { method: 'POST', headers, body: JSON.stringify(manifest[0]) })
const replayBody = await replay.json()
assert.equal(replay.status, 200)
assert.deepEqual(replayBody.posts.map((p) => p.id), summary[0].posts.map((p) => p.id))
await writeFile(`${folder}/replay.json`, JSON.stringify(replayBody, null, 2))
console.log('Passed: two records only, 24 private drafts, identical request replay reuses draft IDs')
