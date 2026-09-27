import config from '@payload-config'
import { getPayload } from 'payload'
import { cardInput, fetchCardPhoto, renderInstagramCard } from '@/outreach/instagram-card'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[1-9]\d{0,8}$/.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers })
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'outreach-posts', where: { and: [
      { id: { equals: Number(id) } }, { platform: { equals: 'instagram' } },
      { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } },
    ] }, overrideAccess: false, draft: false, depth: 1, limit: 1 })
    const input = cardInput(docs[0], process.env.R2_PUBLIC_URL ?? '')
    if (!input) return Response.json({ error: 'not_found' }, { status: 404, headers })
    const response = await renderInstagramCard(input, await fetchCardPhoto(input.photoUrl))
    // Materialize before returning so render errors get a safe, non-cacheable response.
    const png = await response.arrayBuffer()
    return new Response(png, { headers: { ...headers, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="instagram-${id}-${input.language}.png"`, 'X-Content-Type-Options': 'nosniff' } })
  } catch { return Response.json({ error: 'unavailable' }, { status: 503, headers }) }
}
