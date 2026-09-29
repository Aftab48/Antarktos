import { createHash } from 'node:crypto'
import OpenAI from 'openai'
import type { Payload, Where } from 'payload'
import type { User } from '../payload-types'
import { buildGenerationMessages, buildTranslationMessages, PROMPT_VERSION } from './prompts'
import { GenerationError, type GenerationRequest } from './request'
import type { GenerationDependencies, GenerationEvidence } from './generate'
import type { PromptMedia } from './types'

const plain = (value: unknown): string => typeof value === 'string' ? value : ''
const relIds = (value: unknown): number[] => (Array.isArray(value) ? value : [value])
  .map((v) => (v && typeof v === 'object' ? (v as { id?: unknown }).id : v))
  .filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0)

// Photos the model may suggest: the record's own (a photo record, an event's media[], a station or
// expedition cover) and photos linked to the record's stations or expedition. Only published images,
// so the reviewer can publish the post with it and the Instagram card and download can use it.
export function linkedPhotos(collection: GenerationRequest['collection'], id: number, record: Record<string, unknown>): { own: number[]; where: Where } | null {
  const own = collection === 'media' ? [id] : [...relIds(record.media), ...relIds(record.cover)]
  const stations = collection === 'stations' ? [id] : relIds(record.stations)
  const expeditions = collection === 'expeditions' ? [id] : relIds(record.expedition)
  const or: Where[] = [
    ...(own.length ? [{ id: { in: own } }] : []),
    ...(stations.length ? [{ stations: { in: stations } }] : []),
    ...(expeditions.length ? [{ expedition: { in: expeditions } }] : []),
  ]
  return or.length ? { own, where: { and: [{ or }, { _status: { equals: 'published' } }, { mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] } }] } } : null
}

export function generationDependencies(payload: Payload, user: User, input: GenerationRequest): GenerationDependencies {
  const model = process.env.LLM_MODEL_TEXT
  if (!model || !process.env.OPENROUTER_API_KEY) throw new GenerationError('model_not_configured', 503)
  const key = input.requestId
  return {
    reserve: async () => {
      const digest = createHash('sha256').update(JSON.stringify(input)).digest('hex')
      const inserted = await payload.db.pool.query(`insert into outreach_generation_log(request_id,user_id,request_hash,request,model,prompt_version)
        values($1,$2,$3,$4::jsonb,$5,$6) on conflict(request_id) do nothing returning request_id`, [key, user.id, digest, JSON.stringify(input), model, PROMPT_VERSION])
      if (inserted.rowCount) return null
      const { rows } = await payload.db.pool.query('select user_id,request_hash,status,result from outreach_generation_log where request_id=$1', [key])
      const existing = rows[0]
      if (!existing || Number(existing.user_id) !== user.id || existing.request_hash !== digest) throw new GenerationError('request_conflict', 409)
      if (existing.status === 'complete' && existing.result) return existing.result
      throw new GenerationError(existing.status === 'failed' ? 'previous_failure' : 'generation_in_progress', 409)
    },
    evidence: async () => {
      // Read the selected source with the caller's access, never public anonymous override.
      const record = await payload.findByID({ collection: input.collection, id: input.id, depth: 0, locale: 'en', draft: true, overrideAccess: false, user })
      const source = record as unknown as Record<string, unknown>
      const summary = [source.title, source.name, source.summary, source.abstract, source.description].map(plain).join(' ').slice(0, 1600)
      const { rows } = await payload.db.pool.query(`select id::text,text,heading,page from archive_chunks
        where collection=$1 and doc_id=$2 and locale=(case when exists(select 1 from archive_chunks where collection=$1 and doc_id=$2 and locale='en') then 'en' else 'hi' end)
        order by ts_rank(tsv,websearch_to_tsquery(case when locale='hi' then 'hindi'::regconfig else 'english'::regconfig end,$3)) desc,position asc,id asc limit 12`, [input.collection, String(input.id), summary])
      const chunks = rows.map((r: { id: string; text: string; heading: string | null; page: number | null }) => ({ id: r.id, text: r.text.slice(0, 4000), heading: r.heading, page: r.page }))
      const linked = linkedPhotos(input.collection, input.id, source)
      // draft: false reads each photo's published row, so a pending AI caption never reaches the prompt.
      // ponytail: one query capped at 30 by id; a record's own photo can miss the list only if its stations/expedition
      // have 30+ older photos. Query own photos separately if that ever happens.
      const photos = linked ? (await payload.find({ collection: 'media', where: linked.where, limit: 30, sort: 'id', depth: 0, locale: 'en', draft: false, overrideAccess: false, user })).docs : []
      const own = new Set(linked?.own)
      const media: PromptMedia[] = photos
        .sort((a, b) => Number(own.has(b.id)) - Number(own.has(a.id)))
        .slice(0, 8)
        .map((photo) => ({ id: photo.id, caption: plain(photo.caption), alt: plain(photo.alt), credit: plain(photo.credit) }))
      return { chunks, media }
    },
    saveEvidence: async (evidence: GenerationEvidence) => { await payload.db.pool.query('update outreach_generation_log set evidence=$2::jsonb where request_id=$1', [key, JSON.stringify(evidence)]) },
    complete: async (language, evidence, english) => {
      const client = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1', maxRetries: 0, timeout: 140_000 })
      return client.chat.completions.create({ model, messages: language === 'en'
        ? buildGenerationMessages({ platforms: input.platforms, ...evidence })
        : buildTranslationMessages({ items: english ?? [], ...evidence }), response_format: { type: 'json_object' }, max_tokens: 16000, temperature: 0.1 })
    },
    saveRaw: async (language, raw) => { await payload.db.pool.query(`update outreach_generation_log set raw_responses=jsonb_set(raw_responses,array[$2]::text[],$3::jsonb),updated_at=now() where request_id=$1`, [key, language, JSON.stringify(raw)]) },
    saveItem: async ({ item, checks, issues }) => {
      const source = { relationTo: input.collection, value: input.id }
      const post = await payload.create({ collection: 'outreach-posts', draft: true, overrideAccess: false, user, context: { outreachGeneration: true }, data: {
        source, sources: [source], platform: item.platform, language: item.language, title: item.title,
        body: item.body || (item.language === 'hi' ? 'मसौदा तैयार नहीं हो सका। जाँच विवरण देखें।' : 'Draft unavailable. See validation checks.'), dateline: item.dateline, about: item.about, topic: item.topic,
        thread: item.thread.map((text) => ({ text })), hashtags: item.hashtags,
        quiz: item.quiz.map((q) => ({ ...q, chunk_id: Number(q.chunk_id) })),
        suggested_media: item.suggested_media ? Number(item.suggested_media) : null,
        cited_chunk_ids: item.cited_chunk_ids.map(Number), checks, check_issues: issues, model, prompt_version: PROMPT_VERSION,
        generation_request_id: key, review_status: 'pending', _status: 'draft',
      } })
      return post.id
    },
    finish: async (result) => { await payload.db.pool.query("update outreach_generation_log set status='complete',result=$2::jsonb,updated_at=now() where request_id=$1", [key, JSON.stringify(result)]) },
    fail: async () => { await payload.db.pool.query("update outreach_generation_log set status='failed',updated_at=now() where request_id=$1", [key]) },
  }
}
