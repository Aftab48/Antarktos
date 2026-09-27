import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import config from '@payload-config'
import { getPayload } from 'payload'
import { r2ObjectKey } from '@/outreach/presentation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// R2 responds with the attachment; a large image never passes through a Vercel response body.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers })
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'outreach-posts', where: { and: [{ id: { equals: Number(id) } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, overrideAccess: false, draft: false, depth: 1, limit: 1 })
    const media = docs[0]?.suggested_media
    if (!media || typeof media !== 'object' || media._status !== 'published' || !media.mimeType?.startsWith('image/') || !media.url || !media.filename) return Response.json({ error: 'not_found' }, { status: 404, headers })
    const key = r2ObjectKey(media.url, process.env.R2_PUBLIC_URL ?? '')
    if (!key) return Response.json({ error: 'not_found' }, { status: 404, headers })
    const client = new S3Client({ endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, region: 'auto', credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '' }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const filename = encodeURIComponent(media.filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ResponseContentDisposition: `attachment; filename*=UTF-8''${filename}`, ResponseContentType: media.mimeType }), { expiresIn: 60 })
    return new Response(null, { status: 302, headers: { ...headers, Location: url, 'Referrer-Policy': 'no-referrer' } })
  } catch { return Response.json({ error: 'unavailable' }, { status: 503, headers }) }
}
