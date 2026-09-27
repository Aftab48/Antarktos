import { createHash } from 'node:crypto'
import OpenAI from 'openai'
import type { Payload } from 'payload'
import { translator } from '../i18n'
import { archiveFingerprint, retrieveChunks } from './database'
import { questionToKeywords } from './keywords'
import { ASK_PROMPT_VERSION, buildAskMessages, questionLocale } from './prompts'
import { normalizeQuestion, validateAnswer } from './validation'
import type { AskAnswer, Locale, RetrievedChunk } from './types'

export class RateLimitError extends Error {}
export type Completion = { choices: { finish_reason: string | null; message: { content: string | null } }[] }
export type AskDependencies = {
  reserve: (question: string, key: string) => Promise<string>;
  fingerprint: () => Promise<string>;
  cache: (key: string, fingerprint: string) => Promise<AskAnswer | null>;
  retrieve: (query: string, locale: Locale) => Promise<RetrievedChunk[]>;
  complete: (question: string, chunks: RetrievedChunk[], locale: Locale) => Promise<Completion>;
  saveRaw: (id: string, raw: Completion) => Promise<void>;
  saveAnswer: (id: string, answer: AskAnswer, fingerprint: string, checks: unknown) => Promise<void>;
  saveFailure: (id: string, checks: unknown) => Promise<void>;
}

function notFound(locale: Locale, suggestedSearches: string[]): AskAnswer {
  return { status: 'not_found', locale, answer: translator(locale)('ask.notFound'), sentences: [], sources: [], suggestedSearches, cached: false }
}

// Separately injectable boundaries keep the zero-hit, paid-call and cache rules runnable without network or quota.
export async function answerQuestion(question: string, fallback: Locale, deps: AskDependencies): Promise<AskAnswer> {
  const locale = questionLocale(question, fallback)
  const key = createHash('sha256').update(`${ASK_PROMPT_VERSION}:${locale}:${normalizeQuestion(question)}`).digest('hex')
  const id = await deps.reserve(normalizeQuestion(question), key)
  const before = await deps.fingerprint()
  const cached = await deps.cache(key, before)
  if (cached && before === await deps.fingerprint()) return { ...cached, cached: true }
  const query = questionToKeywords(question)
  const suggestions = [...query.matchAll(/"([^"]+)"/gu)].slice(0, 3).map((match) => match[1])
  const chunks = query ? await deps.retrieve(query, locale) : []
  let answer = notFound(locale, suggestions)
  let checks: unknown = { zeroHits: true }
  if (chunks.length) {
    const response = await deps.complete(question, chunks, locale)
    // Store the complete provider envelope before reading or validating any generated content.
    await deps.saveRaw(id, response)
    try {
      if (response.choices[0]?.finish_reason !== 'stop') throw new Error('Incomplete answer')
      const validated = validateAnswer(response.choices[0]?.message.content ?? '', chunks, locale)
      checks = validated.checks
      if (validated.sentences.length) {
        const ids = new Set(validated.sentences.flatMap((s) => [...s.matchAll(/\[c:(\d+)\]/gu)].map((m) => m[1])))
        answer = { status: 'answered', locale, answer: validated.sentences.join(' '), sentences: validated.sentences,
          sources: chunks.filter((c) => ids.has(c.chunkId)).map(({ chunkId, collection, docId, title, titleLocale, page, url }) => ({ chunkId, collection, docId, title, titleLocale, page, url })),
          suggestedSearches: [], cached: false }
      }
    } catch {
      await deps.saveFailure(id, { schema: false })
      throw new Error('Invalid archive answer')
    }
  }
  // Revalidate after generation as a reviewer may have unpublished or changed evidence meanwhile.
  if (before !== await deps.fingerprint()) {
    await deps.saveFailure(id, { sourcesCurrent: false })
    throw new Error('Archive changed during answer generation')
  }
  await deps.saveAnswer(id, answer, before, checks)
  return answer
}

export async function reserveAsk(payload: Payload, ipHash: string, question: string, key: string): Promise<string> {
  const client = await payload.db.pool.connect()
  try {
    await client.query('begin')
    // Separate commands after the lock get a fresh READ COMMITTED snapshot. A single
    // lock/count CTE could over-admit simultaneous requests using a stale snapshot.
    await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [ipHash])
    const { rows } = await client.query("select count(*)::int count from ask_log where ip_hash=$1 and created_at > now()-interval '1 hour'", [ipHash])
    if (rows[0].count >= 10) throw new RateLimitError('rate_limited')
    const inserted = await client.query('insert into ask_log(ip_hash,question,cache_key,prompt_version) values($1,$2,$3,$4) returning id', [ipHash, question, key, ASK_PROMPT_VERSION])
    await client.query('commit')
    return String(inserted.rows[0].id)
  } catch (error) { await client.query('rollback'); throw error }
  finally { client.release() }
}

export function dependencies(payload: Payload, ipHash: string): AskDependencies {
  return {
    reserve: (question, key) => reserveAsk(payload, ipHash, question, key),
    fingerprint: () => archiveFingerprint(payload),
    cache: async (key, fingerprint) => {
      const { rows } = await payload.db.pool.query("select answer from ask_log where cache_key=$1 and fingerprint=$2 and answer is not null and created_at>now()-interval '24 hours' order by created_at desc limit 1", [key, fingerprint])
      return rows[0]?.answer ?? null
    },
    retrieve: (query, locale) => retrieveChunks(payload, query, locale),
    complete: async (question, chunks, locale) => {
      if (!process.env.LLM_MODEL_TEXT || !process.env.OPENROUTER_API_KEY) throw new Error('Archive answer model is not configured')
      const client = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1', maxRetries: 0, timeout: 90_000 })
      return client.chat.completions.create({ model: process.env.LLM_MODEL_TEXT, messages: buildAskMessages(question, chunks.map((c) => ({ id: c.chunkId, text: c.text, heading: c.heading })), locale),
        response_format: { type: 'json_object' }, max_tokens: 1600, temperature: 0.1 })
    },
    saveRaw: async (id, raw) => { await payload.db.pool.query('update ask_log set raw_response=$2::jsonb,model=$3 where id=$1', [id, JSON.stringify(raw), process.env.LLM_MODEL_TEXT ?? null]) },
    saveAnswer: async (id, answer, fingerprint, checks) => { await payload.db.pool.query('update ask_log set answer=$2::jsonb,fingerprint=$3,checks=$4::jsonb where id=$1', [id, JSON.stringify(answer), fingerprint, JSON.stringify(checks)]) },
    saveFailure: async (id, checks) => { await payload.db.pool.query('update ask_log set checks=$2::jsonb where id=$1', [id, JSON.stringify(checks)]) },
  }
}
