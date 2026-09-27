// ponytail: heuristic PDF inspection (regex over raw bytes + zlib inflate of streams),
// not a real PDF parser. Good enough for a page-count / has-text-layer estimate on a
// handful of demo PDFs. Upgrade to a real parser (pdf-parse / unpdf) for the actual text
// extraction pipeline (plan §18 day-1 checks item d, and §7 processing pipeline).
import { inflateSync } from 'node:zlib'

function tryInflate(buf) {
  try {
    return inflateSync(buf)
  } catch {
    return null
  }
}

// Byte-preserving scan: latin1 maps each byte to one char 1:1, so string indices == byte offsets.
function extractStreams(raw) {
  const text = raw.toString('latin1')
  const streams = []
  const re = /stream\r?\n/g
  let m
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[0].length
    const endRel = text.indexOf('endstream', start)
    if (endRel === -1) continue
    streams.push(raw.subarray(start, endRel))
  }
  return streams
}

function countPageObjects(text) {
  const matches = text.match(/\/Type\s*\/Page(?!s)\b/g)
  return matches ? matches.length : 0
}

function hasTextOperators(text) {
  return /\bBT\b[\s\S]{0,1000}?\b(?:Tj|TJ)\b/.test(text)
}

export function inspectPdf(buffer) {
  const rawText = buffer.toString('latin1')
  let pageCount = countPageObjects(rawText)
  let textLayer = hasTextOperators(rawText)

  // Modern PDFs often pack page dicts and content streams inside compressed
  // (FlateDecode) streams or object streams — decompress each and re-check.
  for (const stream of extractStreams(buffer)) {
    const inflated = tryInflate(stream)
    if (!inflated) continue
    const text = inflated.toString('latin1')
    pageCount = Math.max(pageCount, countPageObjects(text))
    if (!textLayer) textLayer = hasTextOperators(text)
  }

  // Fallback: read /Count on the page tree root if no /Type /Page objects were found directly.
  if (pageCount === 0) {
    const m = rawText.match(/\/Type\s*\/Pages[\s\S]{0,200}?\/Count\s+(\d+)/)
    if (m) pageCount = Number(m[1])
  }

  return { pageCount, hasTextLayer: textLayer }
}
