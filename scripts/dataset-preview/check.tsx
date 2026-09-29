// Renders DatasetPreview against a local file server (no database, no R2, no upload).
// Run: node --import tsx scripts/dataset-preview/check.tsx
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { renderToStaticMarkup } from 'react-dom/server'

const rows = Array.from({ length: 5000 }, (_, i) => `Maitri,${new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10)},${(-10 + 8 * Math.sin(i / 20)).toFixed(1)}`)
const csv = Buffer.from(`station,date,temp_c\n${rows.join('\n')}\n`) // ~120 KB, bigger than the 64 KB head
const ranges: string[] = []
const server = createServer((req, res) => {
  const m = /bytes=(\d+)-(\d+)/.exec(req.headers.range ?? '')
  ranges.push(req.headers.range ?? '')
  if (!m) return res.writeHead(200, { 'content-type': 'text/csv' }).end(csv)
  const [a, b] = [Number(m[1]), Math.min(Number(m[2]), csv.length - 1)]
  res.writeHead(206, { 'content-type': 'text/csv', 'content-range': `bytes ${a}-${b}/${csv.length}` }).end(csv.subarray(a, b + 1))
}).listen(0)
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
process.env.R2_PUBLIC_URL = base

const { DatasetPreview } = await import('../../src/app/(frontend)/[lang]/archive/[type]/[id]/DatasetPreview')
const render = async (doc: Record<string, unknown>, l: 'en' | 'hi') => {
  const el = await DatasetPreview({ doc, l })
  return el ? renderToStaticMarkup(el) : ''
}

const en = await render({ url: `${base}/temps.csv`, filename: 'temps.csv', mimeType: 'text/csv' }, 'en')
assert.match(ranges[0], /^bytes=0-65535$/)
assert.equal((en.match(/<tr/g) ?? []).length, 51, 'header + 50 rows')
assert.match(en, /role="img" aria-label="Line chart of temp_c by date from 1 January 2024 to 19 February 2024/)
assert.match(en, /<polyline points="[^"]+"/)
const hi = await render({ url: `${base}/temps.csv`, filename: 'temps.csv', mimeType: 'text/csv' }, 'hi')
assert.match(hi, /डेटा की झलक/)
assert.match(hi, /<table[^>]*lang="en"/)
assert.equal(await render({ url: 'https://example.com/x.csv', filename: 'x.csv', mimeType: 'text/csv' }, 'en'), '', 'only files in R2 are fetched')
assert.equal(await render({ url: `${base}/a.zip`, filename: 'a.zip', mimeType: 'application/zip' }, 'en'), '', 'only CSV/TSV')
server.close()
console.log('dataset preview: ok')
