import config from '@payload-config'
import { getPayload } from 'payload'
import { answerQuestion, dependencies, RateLimitError } from '@/search/ask'
import { boundedJson, hashedClientIP, InputError, validateQuestion } from '@/search/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120
export async function POST(request: Request) {
  try {
    const input = await boundedJson(request)
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('invalid_question')
    const body = input as Record<string, unknown>
    if (Object.keys(body).some((key) => !['question', 'locale'].includes(key)) || (body.locale !== undefined && body.locale !== 'en' && body.locale !== 'hi')) throw new InputError('invalid_question')
    const question = validateQuestion(body.question)
    const ipHash = hashedClientIP(request.headers)
    const payload = await getPayload({ config })
    const answer = await answerQuestion(question, body.locale === 'hi' ? 'hi' : 'en', dependencies(payload, ipHash))
    return Response.json(answer, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof InputError ? 400 : error instanceof RateLimitError ? 429 : 503
    return Response.json({ error: status === 400 ? 'invalid_question' : status === 429 ? 'rate_limited' : 'unavailable' }, {
      status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '3600' } : {}) },
    })
  }
}
