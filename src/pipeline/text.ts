// Pure text helpers: PDF page cleanup and chunking (plan §7), grounding checks for generated text (§10.2, §10.3).

// A page with fewer non-space characters than this has no text layer (plan §7, day-1 check d).
export const EMPTY_PAGE_CHARS = 50
export const CHUNK_WORDS = 800

const letters = (s: string) => s.replace(/\s/g, '').length

// Scanned PDF: most pages have no text layer. OCR is cut (plan §17), such files go to needs_ocr.
export function needsOcr(pages: string[]): boolean {
  return pages.length === 0 || pages.filter((p) => letters(p) < EMPTY_PAGE_CHARS).length > pages.length / 2
}

// Running headers/footers repeat at the edge of many pages and glue onto the page number
// ("ESSO-NCPOR Annual Report 2018-201918"), so lines are compared with their digits masked.
const edgeKey = (line: string) => line.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().toLowerCase()
const isEdge = (i: number, n: number) => i < 2 || i >= n - 2

export function cleanPages(raw: string[]): string[] {
  // NUL: a PDF's ToUnicode map can emit it, and Postgres text/jsonb rejects it (the whole chunk insert fails).
  const pages = raw.map((p) => p.replace(/[\uFFFD\u0000]/g, ' ').split('\n'))
  const counts = new Map<string, number>()
  for (const lines of pages) {
    const keys = new Set(lines.filter((_, i) => isEdge(i, lines.length)).map(edgeKey).filter((k) => k.replace(/[#\s]/g, '').length >= 3))
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const minPages = Math.max(3, pages.length * 0.3)
  const repeated = new Set([...counts].filter(([, n]) => n >= minPages).map(([k]) => k))

  return pages.map((lines) =>
    lines
      .filter((l, i) => !(isEdge(i, lines.length) && (repeated.has(edgeKey(l)) || /^\s*\d{1,4}\s*$/.test(l))))
      .join('\n')
      .replace(/-\n(?=\p{Ll})/gu, '') // line-end hyphenation: "tempera-\nture"
      .replace(/-\n/g, '-') // "October-\nNovember"
      .replace(/\.{4,}|…{2,}/g, ' ') // table-of-contents dot leaders
      .replace(/[ \t]+/g, ' ')
      .trim(),
  )
}

export type Chunk = { page: number; locale: 'en' | 'hi'; text: string }

// A chunk never spans two pages, so every citation lands on one exact PDF page (plan §7, §14).
// A page longer than CHUNK_WORDS splits at line breaks into equal parts of at most about CHUNK_WORDS words.
// ponytail: no heading detection in plain PDF text; `heading` stays null for page chunks.
export function chunkPages(pages: string[]): Chunk[] {
  const chunks: Chunk[] = []
  pages.forEach((page, i) => {
    if (letters(page) < EMPTY_PAGE_CHARS) return
    const lines = page.split('\n').map((l) => [l, l.split(/\s+/).filter(Boolean).length] as const)
    const total = lines.reduce((n, [, w]) => n + w, 0)
    const target = Math.ceil(total / Math.ceil(total / CHUNK_WORDS))
    let buf: string[] = []
    let words = 0
    const flush = () => {
      const text = buf.join(' ').replace(/\s+/g, ' ').trim()
      if (text) chunks.push({ page: i + 1, locale: devanagariShare(text) > 0.5 ? 'hi' : 'en', text })
      buf = []
      words = 0
    }
    for (const [line, w] of lines) {
      if (words > 0 && words + w > target) flush()
      buf.push(line)
      words += w
    }
    flush()
  })
  return chunks
}

// ---- Grounding (plan §10.2, §10.3; ported from scripts/day1/pack-checks.mjs) ----

const DEVANAGARI_DIGITS = '०१२३४५६७८९'
const toAsciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
const MARKER = /\[c:(\d+)\]/g

export const citedIds = (text: string) => [...text.matchAll(MARKER)].map((m) => Number(m[1]))
export const stripMarkers = (text: string) => text.replace(MARKER, '').replace(/\s+([.,;:!?।])/g, '$1').replace(/\s{2,}/g, ' ').trim()

// Numbers as digit strings: Devanagari digits to ASCII, digit-group commas removed ("1,00,000" and
// "100,000" -> "100000"), short year ranges expanded ("2023-24" -> "2023-2024").
export const numbersIn = (text: string) =>
  [...toAsciiDigits(text.replace(MARKER, '')).replace(/\b(\d{2})(\d{2})\s*[-–]\s*(\d{2})\b/g, '$1$2-$1$3').matchAll(/\d+(?:[.,]\d+)*/g)].map((m) =>
    m[0].replace(/,(?=\d{2,3}\b)/g, ''),
  )

// Sentences of a text, headings and blank lines skipped. "।" ends a Hindi sentence.
// ponytail: "." after a 1-3 letter word (Dr., M., डॉ.) counts as an abbreviation, so a Hindi sentence
// ending "है." merges with the next one; fine while models end Hindi sentences with "।".
export const sentences = (body: string) =>
  body
    .split('\n')
    .filter((l) => l.trim() && !/^\s*#/.test(l))
    .flatMap((l) => l.split(/(?<=(?:(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|Shri|Smt|Govt|No|vs|[A-Z])|(?:^|[\s(])[\u0900-\u097F]{1,3})\.|[!?।])(?:\s*\[c:\d+\])*)\s+(?!\[c:)/))
    .map((s) => s.trim())
    .filter((s) => s.replace(/[\s*_\-•]/g, '').length > 3)

export function devanagariShare(text: string): number {
  const all = text.replace(MARKER, '').match(/\p{L}/gu) ?? []
  return all.length ? all.filter((c) => /[\u0900-\u097F]/.test(c)).length / all.length : 0
}

// Keeps grounded sentences only: citation markers for chunks outside `chunks` are removed, then a
// sentence is dropped when it cites nothing or has a number none of its cited chunks contains.
export function groundText(text: string, chunks: Map<number, string>): { text: string; dropped: string[] } {
  const nums = new Map([...chunks].map(([id, t]) => [id, new Set(numbersIn(t))]))
  const kept: string[] = []
  const dropped: string[] = []
  for (const s of sentences(text)) {
    const clean = s.replace(MARKER, (m, id) => (chunks.has(Number(id)) ? m : '')).replace(/\s{2,}/g, ' ').trim()
    const ids = citedIds(clean)
    const ok = ids.length > 0 && numbersIn(clean).every((n) => ids.some((id) => nums.get(id)!.has(n)))
    if (ok) kept.push(clean)
    else dropped.push(s)
  }
  return { text: kept.join(' '), dropped }
}

// Model output as JSON: code fences stripped, must be one object.
export function parseJsonObject(raw: string): Record<string, unknown> {
  const value = JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''))
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not a JSON object')
  return value
}
