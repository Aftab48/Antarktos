// Runnable check for the pure logic in this folder (no network calls).
// Run: node scripts/dataset/test.mjs
import assert from 'node:assert'
import { test } from 'node:test'
import { classifyLicense, hasGps, stripHtml } from './lib/commons.mjs'
import { inspectPdf } from './lib/pdf-inspect.mjs'
import { deflateSync } from 'node:zlib'

test('classifyLicense accepts only cc0/pd/cc-by/cc-by-sa', () => {
  assert.strictEqual(classifyLicense('Cc0'), 'cc0')
  assert.strictEqual(classifyLicense('Public domain'), 'pd')
  assert.strictEqual(classifyLicense('PD-old-70'), 'pd')
  assert.strictEqual(classifyLicense('CC BY 4.0'), 'cc-by')
  assert.strictEqual(classifyLicense('CC BY-SA 3.0'), 'cc-by-sa')
  assert.strictEqual(classifyLicense('CC BY-NC 4.0'), null)
  assert.strictEqual(classifyLicense('CC BY-NC-SA 4.0'), null)
  assert.strictEqual(classifyLicense('CC BY-ND 4.0'), null)
  assert.strictEqual(classifyLicense('All rights reserved'), null)
  assert.strictEqual(classifyLicense(undefined), null)
})

test('stripHtml removes tags and collapses whitespace', () => {
  assert.strictEqual(stripHtml('<span>Jane  Doe</span>\n'), 'Jane Doe')
  assert.strictEqual(stripHtml(undefined), '')
})

test('hasGps reads extmetadata or raw EXIF metadata', () => {
  assert.strictEqual(hasGps({ extmetadata: { GPSLatitude: { value: '70.5' } } }), true)
  assert.strictEqual(hasGps({ extmetadata: {} }), false)
  assert.strictEqual(hasGps({ metadata: [{ name: 'GPSLatitude', value: '70.5' }] }), true)
  assert.strictEqual(hasGps({}), false)
})

test('inspectPdf counts /Type /Page objects and detects text operators, raw and deflated', () => {
  const raw = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n2 0 obj<</Type/Pages/Count 2>>endobj\n' +
      '3 0 obj<</Type/Page>>endobj\n4 0 obj<</Type/Page>>endobj\n' +
      'BT /F1 12 Tf (Hello) Tj ET\n%%EOF',
  )
  const result = inspectPdf(raw)
  assert.strictEqual(result.pageCount, 2)
  assert.strictEqual(result.hasTextLayer, true)

  const scanned = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Pages/Count 1>>endobj\n2 0 obj<</Type/Page>>endobj\n%%EOF',
  )
  const noText = inspectPdf(scanned)
  assert.strictEqual(noText.pageCount, 1)
  assert.strictEqual(noText.hasTextLayer, false)

  // Page dict + text operators hidden inside a FlateDecode stream (as in most real PDFs).
  const inner = '/Type/Page BT /F1 12 Tf (Hi) Tj ET'
  const compressed = deflateSync(Buffer.from(inner))
  const wrapped = Buffer.concat([
    Buffer.from('%PDF-1.4\n5 0 obj<</Filter/FlateDecode>>stream\n'),
    compressed,
    Buffer.from('\nendstream endobj\n%%EOF'),
  ])
  const viaStream = inspectPdf(wrapped)
  assert.strictEqual(viaStream.pageCount, 1)
  assert.strictEqual(viaStream.hasTextLayer, true)
})
