import twitterText from 'twitter-text'
import { citationSentences, quantitiesIn as numericTokens } from '../pipeline/text'
export { citationSentences } from '../pipeline/text'
import { diagnosticItem, itemSchemaErrors } from './schema'
import type { CheckedGenerationItem, EvidenceChunk, GenerationItem, Language, Platform } from './types'

const marker = /\[c:(\d+)\]/gu
const idsIn = (s: string) => [...s.matchAll(marker)].map(m => m[1])
const withoutMarkers = (s: string) => s.replace(/\[c:[^\]\r\n]*\]/gu, '')
const unique = (values: string[]) => [...new Set(values)]
const longForm = (p: Platform) => ['blog', 'press_note', 'student_explainer'].includes(p)
const genericHeadings = /^(?:Overview|Observations|Methods|Limitations|Conclusion|अवलोकन|प्रेक्षण|विधियाँ|सीमाएँ|निष्कर्ष)$/iu

function cleanCitations(text: string, allowed: Set<string>, issues: string[]): string {
  return text.replace(/\[c:[^\]\r\n]*\]/gu, m => {
    const id = /^\[c:(\d+)\]$/u.exec(m)?.[1]
    if (id && allowed.has(id)) return m
    issues.push(`Removed invalid citation ${m}.`)
    return ''
  })
}

function groundLongForm(text: string, allowed: Set<string>, issues: string[]): string {
  return text.split('\n').map(line => {
    if (!line.trim()) return ''
    const label = line.trim().replace(/^#{1,6}\s+/u, '')
    if (/^\s*#{1,6}\s/u.test(line) && genericHeadings.test(label)) return line.trim()
    return citationSentences(line).flatMap(sentence => {
      const clean = cleanCitations(sentence, allowed, issues).replace(/[ \t]{2,}/gu, ' ').trim()
      // Reject a marker in the middle of a sentence; a tail citation must support the whole sentence.
      if (!/\[c:\d+\](?:\s*\[c:\d+\])*(?:[.!?।"'”’)]*)\s*$/u.test(clean)) {
        issues.push(`Dropped uncited sentence: ${withoutMarkers(clean).slice(0, 180)}`)
        return []
      }
      return [clean]
    }).join(' ')
  }).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
}

const wordCount = (s: string) => withoutMarkers(s).replace(/^\s*#{1,6}\s+/gmu, '').split(/\s+/u).filter(Boolean).length
const copyText = (s: string, tags: string[]) => [s, tags.join(' ')].filter(Boolean).join('\n\n').normalize('NFC')
export function platformLength(item: GenerationItem): boolean {
  const words = wordCount(item.body)
  switch (item.platform) {
    case 'blog': return words >= 400 && words <= 700
    case 'student_explainer': return words >= 250 && words <= 400
    case 'press_note': return words >= 250 && words <= 450
    case 'x': return (item.thread.length ? item.thread : [item.body]).every(t => {
      const parsed = twitterText.parseTweet(copyText(t, item.hashtags))
      return parsed.valid && parsed.weightedLength <= 280
    })
    case 'instagram': return Array.from(copyText(item.body, item.hashtags)).length <= 2200 && item.hashtags.length >= 5 && item.hashtags.length <= 10
    case 'linkedin': return Array.from(copyText(item.body, item.hashtags)).length <= 3000
  }
}

// Every item needs a headline (outreach-v1.2): it is the public H1, news card, admin title and Instagram card text.
// The prompt targets 40–70 characters; the check counts what a reader sees (grapheme clusters, markers excluded)
// and allows 20–90. Code points would flag faithful Hindi: a 68-character English headline translates to ~97
// Devanagari code points but ~72 graphemes, and a 46-character one to ~28 graphemes.
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
export const headlineLength = (title: string) => {
  const n = [...graphemes.segment(withoutMarkers(title).trim().normalize('NFC'))].length
  return n >= 20 && n <= 90
}

function languagePass(item: GenerationItem): boolean {
  const text = [item.title, item.body, item.dateline, item.about, ...item.thread, ...item.quiz.flatMap(q => [q.question, ...q.options, q.explanation])].join(' ')
  const letters = withoutMarkers(text).match(/\p{L}/gu) ?? []
  if (!letters.length) return false
  return letters.filter(c => item.language === 'hi' ? /\p{Script=Devanagari}/u.test(c) : /\p{Script=Latin}/u.test(c)).length / letters.length > 0.5
}

function numericIssues(text: string, ids: string[], evidence: Map<string, string>, field: string, issues: string[]) {
  const supported = new Set(ids.flatMap(id => numericTokens(evidence.get(id) ?? '')))
  for (const n of unique(numericTokens(text))) if (!supported.has(n)) issues.push(`Unsupported number ${n} in ${field}.`)
}

function allText(item: GenerationItem): string {
  return [item.title, item.body, item.dateline, item.about, ...item.thread, ...item.hashtags,
    ...item.quiz.flatMap(q => [q.question, ...q.options, q.explanation])].join('\n')
}
const sorted = (values: string[]) => JSON.stringify([...values].sort())
function translationIssues(item: GenerationItem, english: GenerationItem | undefined): string[] {
  if (!english) return ['Missing checked English item for translation comparison.']
  const issues: string[] = []
  if (item.topic !== english.topic || item.suggested_media !== english.suggested_media || sorted(item.cited_chunk_ids) !== sorted(english.cited_chunk_ids)) issues.push('Translation changed topic, media or source IDs.')
  const pairedFields = ['title', 'body', 'dateline', 'about'] as const
  const compare = (a: string, b: string, field: string) => {
    if (sorted(idsIn(a)) !== sorted(idsIn(b))) issues.push(`Translation changed citations in ${field}.`)
    if (sorted(numericTokens(a)) !== sorted(numericTokens(b))) issues.push(`Translation changed numbers in ${field}.`)
    if (Boolean(a.trim()) !== Boolean(b.trim())) issues.push(`Translation changed empty field ${field}.`)
  }
  for (const field of pairedFields) compare(item[field], english[field], field)
  if (item.thread.length !== english.thread.length || item.quiz.length !== english.quiz.length) issues.push('Translation changed thread/quiz structure.')
  item.thread.forEach((t, i) => compare(t, english.thread[i] ?? '', `thread ${i + 1}`))
  item.quiz.forEach((q, i) => {
    const eq = english.quiz[i]
    if (!eq || q.answer_index !== eq.answer_index || q.chunk_id !== eq.chunk_id) issues.push(`Translation changed quiz answer/source ${i + 1}.`)
    if (!eq) return
    compare(q.question, eq.question, `quiz question ${i + 1}`)
    compare(q.explanation, eq.explanation, `quiz explanation ${i + 1}`)
    q.options.forEach((o, j) => compare(o, eq.options[j], `quiz option ${i + 1}/${j + 1}`))
  })
  return issues
}

export type ValidationContext = { platforms: Platform[]; language: Language; chunks: EvidenceChunk[]; mediaIds?: Array<string | number>; englishItems?: GenerationItem[] }
export function validateGenerationPack(raw: unknown, context: ValidationContext): { items: CheckedGenerationItem[]; schemaErrors: string[] } {
  const schemaErrors: string[] = []
  let value: unknown = raw
  if (typeof raw === 'string') {
    if (raw.length > 300000) schemaErrors.push('Response exceeds 300000 characters.')
    else try { value = JSON.parse(raw) } catch { schemaErrors.push('Response is not strict JSON.') }
  }
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  if (!object || Object.keys(object).length !== 1 || !Array.isArray(object.items) || object.items.length !== context.platforms.length) schemaErrors.push('Pack requires only items, one per selected platform.')
  const candidates = Array.isArray(object?.items) ? object.items.slice(0, 6) : []
  const evidence = new Map(context.chunks.map(c => [String(c.id), c.text]))
  const allowed = new Set(evidence.keys())
  const media = new Set((context.mediaIds ?? []).map(String))
  const packErrors = [...schemaErrors]
  const items = context.platforms.map((platform): CheckedGenerationItem => {
    const matches = candidates.filter(v => v && typeof v === 'object' && (v as Record<string, unknown>).platform === platform)
    const errors = [...packErrors, ...(matches.length === 1 ? itemSchemaErrors(matches[0], platform, context.language) : ['Missing or duplicate platform.'])]
    if (errors.length) {
      schemaErrors.push(...errors.map(e => `${platform}: ${e}`))
      return { item: diagnosticItem(platform, context.language), checks: { schema: false, citations: false, numbers: false, length: false, language: false, translation: false }, issues: errors }
    }
    const original = structuredClone(matches[0]) as GenerationItem
    const item = structuredClone(original)
    const citationIssues: string[] = []
    const numberIssues: string[] = []
    item.cited_chunk_ids = item.cited_chunk_ids.filter(id => {
      if (allowed.has(id)) return true
      citationIssues.push(`Removed invalid cited_chunk_id ${id}.`)
      return false
    })
    if (!item.cited_chunk_ids.length) citationIssues.push('No valid source citation IDs.')
    if (item.suggested_media && !media.has(item.suggested_media)) { citationIssues.push('Removed unlinked suggested media.'); item.suggested_media = null }
    for (const field of ['title', 'body', 'dateline', 'about'] as const) {
      item[field] = field !== 'title' && longForm(platform) ? groundLongForm(item[field], allowed, citationIssues) : cleanCitations(item[field], allowed, citationIssues)
      // Check the original text too: invalid citations must not make a bad number disappear silently.
      if (field !== 'title' && longForm(platform)) {
        for (const sentence of citationSentences(original[field])) numericIssues(sentence, idsIn(sentence).filter(id => allowed.has(id)), evidence, field, numberIssues)
      } else numericIssues(original[field], item.cited_chunk_ids, evidence, field, numberIssues)
    }
    item.thread = item.thread.map(t => cleanCitations(t, allowed, citationIssues))
    item.thread.forEach(t => numericIssues(t, item.cited_chunk_ids, evidence, 'thread', numberIssues))
    numericIssues(item.hashtags.join(' '), item.cited_chunk_ids, evidence, 'hashtags', numberIssues)
    item.quiz = item.quiz.flatMap((q, i) => {
      if (!allowed.has(q.chunk_id)) { citationIssues.push(`Dropped quiz question ${i + 1}: invalid source.`); return [] }
      const explanation = groundLongForm(q.explanation, allowed, citationIssues)
      if (!idsIn(explanation).includes(q.chunk_id)) citationIssues.push(`Quiz explanation ${i + 1} must cite its chunk_id.`)
      numericIssues([q.question, q.options[q.answer_index], q.explanation].join(' '), [q.chunk_id], evidence, `quiz ${i + 1}`, numberIssues)
      if (!explanation) { citationIssues.push(`Dropped quiz question ${i + 1}: no cited explanation.`); return [] }
      return [{ ...q, explanation }]
    })
    const referenced = unique([...idsIn(allText(item)), ...item.quiz.map(q => q.chunk_id)])
    if (referenced.some(id => !item.cited_chunk_ids.includes(id))) citationIssues.push('Inline/quiz citation missing from cited_chunk_ids.')
    item.cited_chunk_ids = unique([...item.cited_chunk_ids, ...referenced.filter(id => allowed.has(id))])
    const translation = context.language === 'hi' ? unique([...translationIssues(original, context.englishItems?.find(e => e.platform === platform)), ...translationIssues(item, context.englishItems?.find(e => e.platform === platform))]) : []
    const bodyLength = platformLength(item)
    const headline = headlineLength(item.title)
    const language = languagePass(item)
    if (platform === 'press_note' && (!item.dateline || !item.about)) citationIssues.push('Press note needs source-backed dateline and approved About NCPOR text.')
    if (platform === 'student_explainer' && item.quiz.length !== 5) citationIssues.push('Grounded quiz requires five questions.')
    return { item, checks: { schema: true, citations: citationIssues.length === 0, numbers: numberIssues.length === 0, length: bodyLength && headline, language, translation: translation.length === 0 },
      issues: [...citationIssues, ...numberIssues, ...translation, ...(!headline ? ['Title must be a 20–90 character headline.'] : []), ...(!bodyLength ? ['Platform length failed.'] : []), ...(!language ? ['Target-language script check failed.'] : [])] }
  })
  return { items, schemaErrors: unique(schemaErrors) }
}
