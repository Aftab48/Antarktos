// Day-1 check (e): code-side checks for an outreach pack (plan §10.3), day-1 version.
// Reports pass/fail only; step 7 turns this into the real pipeline (drop uncited sentences etc.).

const DEVANAGARI_DIGITS = '०१२३४५६७८९'
export const toAsciiDigits = (s) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))

const MARKER = /\[c:(\d+)\]/g
export const citedIds = (text) => [...text.matchAll(MARKER)].map((m) => Number(m[1]))
const stripMarkers = (text) => text.replace(MARKER, '')

// Numbers as digit strings, thousands separators removed ("1,500" -> "1500", "५" -> "5"),
// short year ranges expanded ("2023-24" -> "2023-2024") so both spellings match.
export const numbersIn = (text) =>
  [...toAsciiDigits(stripMarkers(text)).replace(/\b(\d{2})(\d{2})\s*[-–]\s*(\d{2})\b/g, '$1$2-$1$3').matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/,(?=\d{3}\b)/g, ''))

// Sentences of a long-form body, headings and blank lines skipped. "।" ends a Hindi sentence.
// ponytail: "." after a 1-3 letter word (Dr., M., डॉ., एम.) is an abbreviation, so a Hindi
// sentence ending "है." merges with the next one; fine while models end Hindi sentences with "।".
export const sentences = (body) =>
  body
    .split('\n')
    .filter((l) => l.trim() && !/^\s*#/.test(l))
    .flatMap((l) => l.split(/(?<=(?:(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|Shri|Smt|Govt|No|vs|[A-Z])|(?:^|[\s(])[\u0900-\u097F]{1,3})\.|[!?।])(?:\s*\[c:\d+\])*)\s+(?!\[c:)/))
    .map((s) => s.trim())
    .filter((s) => s.replace(/[\s*_\-•]/g, '').length > 3)

export function scriptShare(text) {
  const letters = stripMarkers(text).match(/\p{L}/gu) ?? []
  const deva = letters.filter((c) => /[\u0900-\u097F]/.test(c)).length
  return letters.length ? deva / letters.length : 0
}

const words = (s) => stripMarkers(s).split(/\s+/).filter(Boolean).length
const chars = (s) => [...s].length // code points; X's own weighting differs slightly

export function checkPack(pack, chunks, lang) {
  const ids = new Set(chunks.map((c) => c.id))
  const chunkNums = new Map(chunks.map((c) => [c.id, new Set(numbersIn(c.text))]))
  const checks = []
  const add = (name, pass, detail = '') => checks.push({ name, pass, detail })
  const it = pack?.items ?? {}

  // Schema
  const q = it.student_explainer?.quiz
  const schemaOk =
    typeof it.blog?.title === 'string' && typeof it.blog?.body === 'string' &&
    typeof it.x?.post === 'string' && Array.isArray(it.x?.cited_chunk_ids) &&
    typeof it.instagram?.caption === 'string' && Array.isArray(it.instagram?.hashtags) &&
    typeof it.linkedin?.post === 'string' &&
    typeof it.press_note?.headline === 'string' && typeof it.press_note?.body === 'string' &&
    typeof it.student_explainer?.body === 'string' && Array.isArray(q) && q.length === 5 &&
    q.every((x) => Array.isArray(x.options) && x.options.length === 4 && Number.isInteger(x.answer_index) && x.answer_index >= 0 && x.answer_index <= 3)
  add('schema', schemaOk)
  if (!schemaOk) return checks

  // Citations + numbers, long-form (per sentence: numbers must appear in that sentence's cited chunks)
  for (const key of ['blog', 'press_note', 'student_explainer']) {
    const ss = sentences(it[key].body)
    const invalid = ss.flatMap(citedIds).filter((id) => !ids.has(id))
    const uncited = ss.filter((s) => citedIds(s).filter((id) => ids.has(id)).length === 0)
    add(`${key}.citations_valid`, invalid.length === 0, invalid.length ? `invalid ids: ${[...new Set(invalid)].join(',')}` : '')
    add(`${key}.all_sentences_cited`, uncited.length === 0, `${uncited.length}/${ss.length} uncited`)
    const unmatched = ss.flatMap((s) => {
      const cited = citedIds(s).filter((id) => ids.has(id))
      return numbersIn(s).filter((n) => !cited.some((id) => chunkNums.get(id).has(n)))
    })
    add(`${key}.numbers_match`, unmatched.length === 0, unmatched.length ? `unmatched: ${[...new Set(unmatched)].join(', ')}` : '')
  }
  // Social posts: numbers must appear in the post's cited chunks
  for (const [key, text] of [['x', [it.x.post, ...(it.x.thread ?? [])].map((t) => t.replace(/^\s*\d+\/\d+\s*/, '')).join('\n')], ['instagram', it.instagram.caption], ['linkedin', it.linkedin.post]]) {
    const cited = (it[key].cited_chunk_ids ?? []).map(Number)
    const invalid = cited.filter((id) => !ids.has(id))
    add(`${key}.citations_valid`, cited.length > 0 && invalid.length === 0, cited.length ? (invalid.length ? `invalid ids: ${invalid.join(',')}` : '') : 'no cited_chunk_ids')
    const unmatched = numbersIn(text).filter((n) => !cited.some((id) => chunkNums.get(id)?.has(n)))
    add(`${key}.numbers_match`, unmatched.length === 0, unmatched.length ? `unmatched: ${[...new Set(unmatched)].join(', ')}` : '')
  }
  add('quiz.chunk_ids_valid', q.every((x) => ids.has(Number(x.chunk_id))))

  // Length limits (§10.1)
  const bw = words(it.blog.body), ew = words(it.student_explainer.body)
  const xLens = [it.x.post, ...(it.x.thread ?? [])].map(chars)
  add('blog.length', bw >= 400 && bw <= 700, `${bw} words`)
  add('x.length', xLens.every((n) => n <= 280) && (!it.x.thread?.length || (it.x.thread.length >= 3 && it.x.thread.length <= 5)), `${xLens.join('/')} chars, thread ${it.x.thread?.length ?? 0}`)
  add('instagram.length', chars(it.instagram.caption) <= 2200 && it.instagram.hashtags.length >= 5 && it.instagram.hashtags.length <= 10, `${chars(it.instagram.caption)} chars, ${it.instagram.hashtags.length} tags`)
  add('linkedin.length', chars(it.linkedin.post) <= 3000, `${chars(it.linkedin.post)} chars`)
  add('student_explainer.length', ew >= 250 && ew <= 400, `${ew} words`)

  // Language: share of Devanagari among letters
  const all = [it.blog.body, it.x.post, it.instagram.caption, it.linkedin.post, it.press_note.body, it.student_explainer.body].join('\n')
  const share = scriptShare(all)
  add('language', lang === 'hi' ? share >= 0.6 : share <= 0.05, `Devanagari ${Math.round(share * 100)}% of letters`)
  return checks
}
