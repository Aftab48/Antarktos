import config from '@payload-config'
import { getPayload } from 'payload'
import { boundedJson, InputError } from '@/search/validation'
import { staffRole } from '@/outreach/access'
import { GenerationError, parseGenerationRequest, requireSameOrigin } from '@/outreach/request'
import { generateOutreach } from '@/outreach/generate'
import { generationDependencies } from '@/outreach/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300
export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user || !staffRole(user.role)) throw new GenerationError('staff_only', 403)
    const input = parseGenerationRequest(await boundedJson(request))
    const result = await generateOutreach(input, generationDependencies(payload, user, input))
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof GenerationError ? error.status : error instanceof InputError ? 400 : 503
    return Response.json({ error: error instanceof GenerationError ? error.code : status === 400 ? 'invalid_request' : 'generation_unavailable' }, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}
