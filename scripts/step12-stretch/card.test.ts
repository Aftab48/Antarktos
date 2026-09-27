import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { cardInput, CARD_IMAGE_LIMIT, fetchCardPhoto, renderInstagramCard } from '../../src/outreach/instagram-card'
const base = 'https://media.example.org/archive'
const post = { _status: 'published', review_status: 'approved', platform: 'instagram', language: 'hi', title: 'अंटार्कटिका में भारतीय अनुसंधान [c:42]', suggested_media: { _status: 'published', mimeType: 'image/jpeg', url: `${base}/photo.jpg`, credit: 'Synthetic test image', license: 'Test fixture' } }

test('only approved published Instagram posts and published trusted photos qualify', () => {
  assert.equal(cardInput(post, base)?.headline, 'अंटार्कटिका में भारतीय अनुसंधान')
  for (const changed of [{ _status: 'draft' }, { review_status: 'pending' }, { platform: 'blog' }, { language: 'fr' }, { title: '' }]) assert.equal(cardInput({ ...post, ...changed }, base), null)
  for (const changed of [{ _status: 'draft' }, { mimeType: 'video/mp4' }, { url: 'http://localhost/photo.jpg' }, { url: `${base}/photo.jpg?key=secret` }, { url: 'https://media.example.org/other/photo.jpg' }, { url: 'https://bad.example.org/archive/photo.jpg' }]) assert.equal(cardInput({ ...post, suggested_media: { ...post.suggested_media, ...changed } }, base), null)
})
test('photo fetch rejects redirect, untrusted content types and oversized streamed bodies', async () => {
  let options: RequestInit | undefined
  const ok = await fetchCardPhoto(`${base}/photo.jpg`, (async (_url, init) => { options = init; return new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/jpeg' } }) }) as typeof fetch)
  assert.equal(ok.length, 2)
  assert.equal(options?.redirect, 'error')
  await assert.rejects(fetchCardPhoto(`${base}/photo.jpg`, (async () => new Response('text', { headers: { 'content-type': 'text/html' } })) as typeof fetch))
  await assert.rejects(fetchCardPhoto(`${base}/photo.jpg`, (async () => new Response(new Uint8Array(CARD_IMAGE_LIMIT + 1), { headers: { 'content-type': 'image/png' } })) as typeof fetch), /photo_too_large/)
})
test('ImageResponse renders English and shaped Hindi fixtures as 1080 square PNGs', async () => {
  await mkdir('artifacts/step12-stretch', { recursive: true })
  const photo = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="620"><rect width="1080" height="620" fill="#aecfdf"/><path d="M0 620L370 100L700 620Z" fill="#fafcfc"/><path d="M420 620L830 180L1080 620Z" fill="#e1edf1"/></svg>')).png().toBuffer()
  for (const [language, headline] of [['en', 'Indian research in Antarctica'], ['hi', 'अंटार्कटिका में भारतीय अनुसंधान'], ['hi-long', 'अंटार्कटिका में भारतीय अनुसंधान: पृथ्वी, समुद्र और जलवायु परिवर्तन के अध्ययन में वैज्ञानिकों का योगदान']] as const) {
    const response = await renderInstagramCard({ headline, credit: 'Synthetic test image · Test fixture', language: language === 'en' ? 'en' : 'hi' }, photo)
    const png = Buffer.from(await response.arrayBuffer())
    const meta = await sharp(png).metadata()
    assert.equal(meta.format, 'png'); assert.equal(meta.width, 1080); assert.equal(meta.height, 1080)
    await writeFile(`artifacts/step12-stretch/card-${language}.png`, png)
  }
})
