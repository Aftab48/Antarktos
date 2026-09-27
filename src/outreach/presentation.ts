// Shared presentation logic contains no server secrets and makes no provider calls.
export const TOPICS = ['ice', 'climate', 'oceans', 'life_in_antarctica', 'stations', 'expeditions'] as const
export const PLATFORMS = ['blog', 'x', 'instagram', 'linkedin', 'press_note', 'student_explainer'] as const
export type CitationSource = { id: number; title: string; recordUrl: string; page: number | null; pageUrl?: string }
export type QuizItem = { question: string; options: string[]; answer_index: number; explanation?: string | null; chunk_id?: number | null }

export function validQuiz(items: unknown): QuizItem[] {
  if (!Array.isArray(items)) return []
  return items.filter((q): q is QuizItem => q && typeof q.question === 'string' && q.question.trim() &&
    Array.isArray(q.options) && q.options.length === 4 && q.options.every((o: unknown) => typeof o === 'string' && o.trim()) &&
    Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4 &&
    typeof q.explanation === 'string' && q.explanation.trim() && Number.isSafeInteger(q.chunk_id) && q.chunk_id > 0)
}

export function copyText(post: { platform?: string; body?: string | null; title?: string | null; hashtags?: string[] | null; thread?: { text?: string | null }[] | null; dateline?: string | null; about?: string | null }) {
  const social = ['x', 'instagram', 'linkedin'].includes(post.platform ?? '')
  const bodies = post.thread?.length ? post.thread.map((p) => p.text) : [post.body]
  const parts = [...(social ? [] : [post.title, post.dateline]), ...bodies, ...(social ? [] : [post.about]), post.hashtags?.join(' ')]
  return parts.filter(Boolean).join('\n\n').replace(/\s*\[c:\d+\]/g, '').trim()
}

export const xIntent = (text: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
export const linkedInIntent = (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

// Payload's configured public URL already includes the stored prefix and unique object folder.
// Resolve only that origin and base path; never sign a caller-provided object or external URL.
export function r2ObjectKey(fileUrl: string, publicBase: string): string | null {
  try {
    const base = new URL(publicBase.replace(/\/$/, '') + '/')
    const file = new URL(fileUrl)
    if (file.origin !== base.origin || !file.pathname.startsWith(base.pathname)) return null
    const key = decodeURIComponent(file.pathname.slice(base.pathname.length))
    return key && !key.split('/').some((p) => !p || p === '.' || p === '..') && !/[\\\x00-\x1f]/.test(key) ? key : null
  } catch { return null }
}

export function sourceRecordPath(collection: string, id: string | number) {
  return collection === 'stations' || collection === 'expeditions' ? `/${collection}/${id}` : `/archive/${collection}/${id}`
}

// Inline markers only become links when the server resolved a readable source.
export function citationParts(text: string) {
  return text.split(/(\[c:\d+\])/g).map((part) => {
    const match = /^\[c:(\d+)\]$/.exec(part)
    return match ? { id: Number(match[1]) } : { text: part }
  })
}
