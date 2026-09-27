// Download the demo PDFs listed in data/pdfs/sources.txt and record page count +
// text-layer estimate for each. Skips and reports any link that fails.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { inspectPdf } from './lib/pdf-inspect.mjs'
import { writeCsv } from './lib/csv.mjs'
import { USER_AGENT, fetchWithRetry } from './lib/commons.mjs'

const SOURCES_FILE = path.resolve('data/pdfs/sources.txt')
const OUT_DIR = path.resolve('data/pdfs')
const REQUEST_DELAY_MS = 500

function parseSources(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

function filenameFor(url) {
  const clean = decodeURIComponent(url.split('?')[0])
  const base = path.basename(clean)
  return base || `${Buffer.from(url).toString('hex').slice(0, 16)}.pdf`
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const urls = parseSources(await readFile(SOURCES_FILE, 'utf8'))

  const rows = []
  const failures = []

  for (const url of urls) {
    const filename = filenameFor(url)
    console.log(`Fetching: ${url}`)
    try {
      const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 100 || buf.toString('latin1', 0, 5) !== '%PDF-') {
        throw new Error('response is not a PDF')
      }
      await writeFile(path.join(OUT_DIR, filename), buf)

      const { pageCount, hasTextLayer } = inspectPdf(buf)
      rows.push({
        file: filename,
        source_url: url,
        size_bytes: buf.length,
        page_count_estimate: pageCount,
        has_text_layer: hasTextLayer ? 'true' : 'false',
      })
      console.log(`  ok: ${filename} (${buf.length} bytes, ~${pageCount} pages, text layer: ${hasTextLayer})`)
    } catch (err) {
      console.warn(`  FAILED: ${url} (${err.message})`)
      failures.push({ url, error: err.message })
    }
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
  }

  await writeCsv(
    path.join(OUT_DIR, 'manifest.csv'),
    ['file', 'source_url', 'size_bytes', 'page_count_estimate', 'has_text_layer'],
    rows,
  )

  console.log('\n=== PDF collection summary ===')
  console.log(`Downloaded: ${rows.length} / ${urls.length}`)
  if (failures.length) {
    console.log('Failed:')
    for (const f of failures) console.log(`  ${f.url}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
