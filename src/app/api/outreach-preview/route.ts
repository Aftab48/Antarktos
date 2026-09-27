import config from '@payload-config'
import { getPayload } from 'payload'
import { staffRole } from '@/outreach/access'
import { outreachCitations } from '@/outreach/citation-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !staffRole(user.role)) return Response.json({ error: 'forbidden' }, { status: 403, headers })
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !/^\d{1,9}$/.test(id)) return Response.json({ error: 'invalid_id' }, { status: 400, headers })
  const { docs } = await payload.find({ collection: 'outreach-posts', where: { id: { equals: Number(id) } }, draft: true, overrideAccess: false, user, depth: 0, limit: 1 })
  const post = docs[0]
  if (!post) return Response.json({ error: 'not_found' }, { status: 404, headers })
  const sources = await outreachCitations(payload, post, post.language === 'hi' ? 'hi' : 'en', user)
  return Response.json({ sources }, { headers })
}
