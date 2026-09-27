import { PLATFORMS, TOPICS, type GenerationItem, type Language, type Platform } from './types'

const text = (maxLength: number) => ({ type: 'string', maxLength })
const id = { type: 'string', pattern: '^[1-9][0-9]*$', maxLength: 20 }
const quizSchema = {
  type: 'object', additionalProperties: false,
  required: ['question', 'options', 'answer_index', 'explanation', 'chunk_id'],
  properties: { question: text(1000), options: { type: 'array', minItems: 4, maxItems: 4, items: text(500) },
    answer_index: { type: 'integer', minimum: 0, maximum: 3 }, explanation: text(3000), chunk_id: id },
}

export function generationSchema(platforms: readonly Platform[], language: Language) {
  return {
    type: 'object', additionalProperties: false, required: ['items'],
    properties: { items: { type: 'array', minItems: platforms.length, maxItems: platforms.length,
      items: { type: 'object', additionalProperties: false,
        required: ['platform', 'language', 'title', 'body', 'dateline', 'about', 'thread', 'hashtags', 'quiz', 'suggested_media', 'cited_chunk_ids', 'topic'],
        properties: {
          platform: { type: 'string', enum: platforms }, language: { type: 'string', enum: [language] },
          title: text(500), body: text(30000), dateline: text(500), about: text(4000),
          thread: { type: 'array', maxItems: 5, items: text(2000) },
          hashtags: { type: 'array', maxItems: 10, items: { ...text(100), pattern: '^#[^\\s#]+$' } },
          quiz: { type: 'array', maxItems: 5, items: quizSchema },
          suggested_media: { anyOf: [id, { type: 'null' }] },
          cited_chunk_ids: { type: 'array', maxItems: 100, uniqueItems: true, items: id },
          topic: { anyOf: [{ type: 'string', enum: TOPICS }, { type: 'null' }] },
        },
      },
    } },
  }
}

const keys = ['platform', 'language', 'title', 'body', 'dateline', 'about', 'thread', 'hashtags', 'quiz', 'suggested_media', 'cited_chunk_ids', 'topic']
const isObject = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v))
const exact = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k))
const isText = (v: unknown, max: number) => typeof v === 'string' && v.length <= max && !v.includes('\u0000')
const isId = (v: unknown) => typeof v === 'string' && /^[1-9]\d{0,19}$/u.test(v)
const strings = (v: unknown, maxItems: number, maxLength: number): v is string[] => Array.isArray(v) && v.length <= maxItems && v.every(x => isText(x, maxLength))

// This mirrors the provider schema and adds cross-field constraints JSON Schema alone cannot express.
export function itemSchemaErrors(v: unknown, platform: Platform, language: Language): string[] {
  if (!isObject(v) || !exact(v, keys)) return ['Item keys must exactly match the schema.']
  const errors: string[] = []
  if (v.platform !== platform || !(PLATFORMS as readonly unknown[]).includes(v.platform) || v.language !== language) errors.push('Platform/language mismatch.')
  for (const [key, max] of [['title', 500], ['body', 30000], ['dateline', 500], ['about', 4000]] as const) if (!isText(v[key], max)) errors.push(`Invalid ${key}.`)
  if (typeof v.body === 'string' && !v.body.trim()) errors.push('Empty body.')
  if (!strings(v.thread, 5, 2000)) errors.push('Invalid thread.')
  else if (platform === 'x' ? v.thread.length !== 0 && (v.thread.length < 3 || v.thread.some(t => !t.trim())) : v.thread.length !== 0) errors.push('Only X allows a thread of 3–5 posts.')
  else if (platform === 'x' && v.thread.length && v.body !== v.thread[0]) errors.push('X body must equal its first thread post.')
  if (!strings(v.hashtags, 10, 100) || !v.hashtags.every(tag => /^#[^\s#]+$/u.test(tag))) errors.push('Invalid hashtags.')
  if (!Array.isArray(v.cited_chunk_ids) || v.cited_chunk_ids.length > 100 || !v.cited_chunk_ids.every(isId) || new Set(v.cited_chunk_ids).size !== v.cited_chunk_ids.length) errors.push('Invalid citation IDs.')
  if (v.suggested_media !== null && !isId(v.suggested_media)) errors.push('Invalid suggested media ID.')
  if (v.topic !== null && !(TOPICS as readonly unknown[]).includes(v.topic)) errors.push('Invalid topic.')
  if (platform === 'student_explainer' && v.topic === null) errors.push('Student explainer requires a topic.')
  if (platform !== 'press_note' && (v.dateline !== '' || v.about !== '')) errors.push('Only press notes have dateline/about fields.')
  if (!Array.isArray(v.quiz) || v.quiz.length !== (platform === 'student_explainer' ? 5 : 0)) errors.push('Student quiz must contain exactly 5 questions; other platforms use [].')
  else for (const q of v.quiz) {
    if (!isObject(q) || !exact(q, ['question', 'options', 'answer_index', 'explanation', 'chunk_id']) ||
      !isText(q.question, 1000) || !String(q.question).trim() || !strings(q.options, 4, 500) || q.options.length !== 4 || q.options.some(o => !o.trim()) || new Set(q.options).size !== 4 ||
      !Number.isInteger(q.answer_index) || Number(q.answer_index) < 0 || Number(q.answer_index) > 3 || !isText(q.explanation, 3000) || !String(q.explanation).trim() || !isId(q.chunk_id)) errors.push('Malformed quiz question.')
  }
  return errors
}

export function diagnosticItem(platform: Platform, language: Language): GenerationItem {
  return { platform, language, title: '', body: language === 'hi' ? 'निर्माण विफल: स्रोत और सहेजे गए कच्चे उत्तर की समीक्षा करें।' : 'Generation failed: review the source and saved raw response.', dateline: '', about: '', thread: [], hashtags: [], quiz: [], suggested_media: null, cited_chunk_ids: [], topic: null }
}
