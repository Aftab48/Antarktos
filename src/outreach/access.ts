import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'
import { canPublish } from '../access'

export const staffRole = (role: unknown) => role === 'editor' || role === 'reviewer' || role === 'admin'
const contentFields = ['source', 'platform', 'language', 'title', 'body', 'dateline', 'about', 'thread', 'hashtags', 'quiz', 'suggested_media', 'topic']
const systemFields = ['sources', 'cited_chunk_ids', 'checks', 'check_issues', 'model', 'prompt_version', 'generation_request_id']
const reviewFields = ['review_status', 'review_note', 'reviewed_by', 'reviewed_at']

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const relationshipId = (value: unknown) => {
  const id = value && typeof value === 'object' ? asRecord(value).id : value
  return id == null || id === '' ? null : String(id)
}
// Admin forms can send a populated relationship where originalDoc has an ID,
// or regenerate array-row IDs. Those are serialization differences, not edits.
// Compare only authored values; keep order meaningful for threads, options and quizzes.
function authoredValue(field: string, value: unknown): unknown {
  if (field === 'source') {
    const source = asRecord(value)
    return { relationTo: source.relationTo ?? null, value: relationshipId(source.value) }
  }
  if (field === 'suggested_media') return relationshipId(value)
  if (field === 'thread') return (Array.isArray(value) ? value : []).map((row) => asRecord(row).text ?? '')
  if (field === 'hashtags') return Array.isArray(value) ? value : []
  if (field === 'quiz') return (Array.isArray(value) ? value : []).map((row) => {
    const question = asRecord(row)
    return { question: question.question ?? '', options: Array.isArray(question.options) ? question.options : [],
      answer_index: question.answer_index == null ? null : Number(question.answer_index), explanation: question.explanation ?? '', chunk_id: relationshipId(question.chunk_id) }
  })
  return value ?? ''
}

// All metadata is server-owned even for an administrator's REST/GraphQL edit.
// Changing generated text invalidates the old checks and approval until reviewed again.
export const guardOutreach: CollectionBeforeChangeHook = async ({ data, originalDoc, req, context }) => {
  if (context.outreachGeneration === true) return { ...data, _status: 'draft', review_status: 'pending', reviewed_by: null, reviewed_at: null }
  const before = originalDoc ?? {}
  const changed = !!originalDoc && contentFields.some((field) => field in data && JSON.stringify(authoredValue(field, data[field])) !== JSON.stringify(authoredValue(field, before[field])))
  for (const field of systemFields) data[field] = before[field] ?? null
  // Relationship arrays default to empty rather than null on newly hand-authored drafts.
  data.sources = before.sources ?? []
  data.cited_chunk_ids = before.cited_chunk_ids ?? []
  data.reviewed_by = before.reviewed_by ?? null
  data.reviewed_at = before.reviewed_at ?? null
  if (!canPublish(req)) for (const field of reviewFields) data[field] = before[field] ?? (field === 'review_status' ? 'pending' : null)
  if (changed) {
    data.checks = { schema: false, citations: false, numbers: false, length: false, language: false, translation: false }
    data.check_issues = ['Content edited after generation: checks are stale; verify the revised text and source citations before approval.']
    data.review_status = 'pending'
    data.reviewed_by = null
    data.reviewed_at = null
    data._status = 'draft'
  }
  if (!changed && canPublish(req) && data.review_status && data.review_status !== (before.review_status ?? 'pending')) {
    if (data.review_status === 'rejected' && !String(data.review_note ?? before.review_note ?? '').trim()) throw new APIError('Add a review note before rejecting.', 400)
    data.reviewed_by = req.user?.id
    data.reviewed_at = new Date().toISOString()
  }
  if ((data._status ?? before._status) === 'published' && (data.review_status ?? before.review_status) !== 'approved') throw new APIError('Approve the outreach draft before publishing.', 400)
  if ((data._status ?? before._status) === 'published') {
    const source = data.source ?? before.source
    const sourceId = typeof source?.value === 'object' ? source.value.id : source?.value
    if (!sourceId || !source?.relationTo) throw new APIError('A published source record is required.', 400)
    const record = await req.payload.findByID({ collection: source.relationTo, id: sourceId, depth: 0, draft: false, overrideAccess: false, req })
    if (record._status !== 'published') throw new APIError('Publish the source record before publishing outreach.', 400)
    const media = data.suggested_media ?? before.suggested_media
    if (media) {
      const photo = await req.payload.findByID({ collection: 'media', id: typeof media === 'object' ? media.id : media, depth: 0, draft: false, overrideAccess: false, req })
      if (photo._status !== 'published') throw new APIError('Publish the suggested image before publishing outreach.', 400)
    }
  }
  return data
}
