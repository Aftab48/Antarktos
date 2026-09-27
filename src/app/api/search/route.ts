import config from '@payload-config'
import { getPayload } from 'payload'
import { searchArchive } from '@/search/database'
import { InputError, parseSearchFilters } from '@/search/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const filters = parseSearchFilters(new URL(request.url).searchParams)
    const payload = await getPayload({ config })
    return Response.json(await searchArchive(payload, filters), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return Response.json({ error: error instanceof InputError ? 'invalid_filters' : 'unavailable' }, { status: error instanceof InputError ? 400 : 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
