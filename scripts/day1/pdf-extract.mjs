// Day-1 check (d): extract text from the demo PDFs with unpdf, per page.
// Writes artifacts/day1/pdf/<name>.pages.json and prints a summary table.
// Run: node scripts/day1/pdf-extract.mjs
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { getDocumentProxy, extractText } from 'unpdf'

const dir = 'data/pdfs'
const out = 'artifacts/day1/pdf'
await mkdir(out, { recursive: true })

const EMPTY_PAGE_CHARS = 50 // fewer non-space chars than this = no usable text layer on that page
const summary = []
for (const file of (await readdir(dir)).filter((f) => /\.pdf$/i.test(f))) {
  const buf = await readFile(path.join(dir, file))
  const t0 = performance.now()
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const { totalPages, text } = await extractText(pdf, { mergePages: false })
  const ms = Math.round(performance.now() - t0)
  const chars = text.map((t) => t.replace(/\s/g, '').length)
  const emptyPages = chars.map((c, i) => (c < EMPTY_PAGE_CHARS ? i + 1 : null)).filter(Boolean)
  const all = text.join('\n')
  const letters = all.match(/\p{L}/gu)?.length ?? 0
  const odd = all.match(/[�\u0000-\u0008-]/gu)?.length ?? 0 // replacement, control, private-use glyphs
  const devanagari = all.match(/[ऀ-ॿ]/g)?.length ?? 0
  const words = all.split(/\s+/).filter(Boolean).length
  await writeFile(path.join(out, file.replace(/\.pdf$/i, '') + '.pages.json'), JSON.stringify(text.map((t, i) => ({ page: i + 1, text: t })), null, 1))
  summary.push({
    file, mb: +(buf.length / 1e6).toFixed(1), pages: totalPages, ms, words,
    emptyPages: emptyPages.length, emptyPageList: emptyPages.slice(0, 20),
    medianCharsPerPage: chars.slice().sort((a, b) => a - b)[Math.floor(chars.length / 2)],
    oddCharRatio: +(odd / Math.max(letters, 1)).toFixed(4), devanagariChars: devanagari,
    verdict: emptyPages.length === totalPages ? 'scanned (no text layer)' : emptyPages.length > totalPages / 2 ? 'mostly scanned' : 'text layer',
  })
}
console.table(summary.map(({ emptyPageList, ...s }) => s))
await writeFile(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2))
