import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { r2ObjectKey } from './presentation'

type RecordData = Record<string, any>
export const CARD_IMAGE_LIMIT = 5 * 1024 * 1024

export function cardInput(post: RecordData | undefined, publicBase: string) {
  if (!post || post._status !== 'published' || post.review_status !== 'approved' || post.platform !== 'instagram' || !['en', 'hi'].includes(post.language)) return null
  const media = post.suggested_media
  if (!media || typeof media !== 'object' || media._status !== 'published' || !/^image\/(jpeg|png|webp)$/.test(media.mimeType ?? '')) return null
  const headline = typeof post.title === 'string' ? post.title.replace(/\s*\[c:[^\]]*\]/g, '').trim() : ''
  if (!headline || headline.length > 500) return null
  // Use the existing upload derivative where possible; both URLs must remain within the configured R2 origin/path.
  const photoUrl = media.sizes?.large?.url || media.url
  if (typeof photoUrl !== 'string' || !r2ObjectKey(photoUrl, publicBase)) return null
  const parsed = new URL(photoUrl)
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) return null
  const credit = [media.credit, media.license].filter((s): s is string => typeof s === 'string' && !!s.trim()).join(' · ')
  if (credit.length > 1000) return null
  return { headline, photoUrl, credit, language: post.language as 'en' | 'hi' }
}

export async function fetchCardPhoto(url: string, fetcher: typeof fetch = fetch): Promise<Buffer> {
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(8000), cache: 'no-store' })
  if (!response.ok || !/^image\/(jpeg|png|webp)(?:;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body) throw new Error('invalid_photo')
  if (Number(response.headers.get('content-length')) > CARD_IMAGE_LIMIT) { await response.body.cancel(); throw new Error('photo_too_large') }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > CARD_IMAGE_LIMIT) throw new Error('photo_too_large')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  return Buffer.concat(chunks)
}

const escapeMarkup = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
const dataImage = (image: Buffer) => `data:image/png;base64,${image.toString('base64')}`

// Pango shapes the self-hosted Devanagari font before ImageResponse lays out the card.
// This preserves Hindi conjuncts/vowel placement, which Satori's text renderer cannot reliably shape.
async function textImage(text: string, width: number, height: number, color: string, size: number) {
  const result = await sharp({ text: { text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
    font: `Noto Sans Devanagari ${size}`, fontfile: path.join(process.cwd(), 'public/fonts/NotoSansDevanagari.ttf'),
    width, height, rgba: true, wrap: 'word-char',
  } }).png().toBuffer({ resolveWithObject: true })
  return { src: dataImage(result.data), width: result.info.width, height: result.info.height }
}

export async function renderInstagramCard(input: { headline: string; credit: string; language: 'en' | 'hi' }, photo: Buffer) {
  const photoPng = await sharp(photo, { limitInputPixels: 40_000_000 }).rotate().resize(1080, 620, { fit: 'cover' }).png().toBuffer()
  const title = await textImage(input.headline, 952, 260, '#ffffff', 54)
  const credit = input.credit ? await textImage(input.credit, 952, 48, '#c5dae3', 20) : null
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#12384b' }}>
      <img alt="" src={dataImage(photoPng)} width={1080} height={620} />
      <div style={{ display: 'flex', flexDirection: 'column', padding: '44px 64px 30px', height: 460, borderTop: '8px solid #67c3cd' }}>
        <img alt={input.headline} {...title} style={{ objectFit: 'contain', objectPosition: 'left top' }} />
        {credit && <div style={{ display: 'flex', marginTop: 'auto' }}><img alt={input.credit} {...credit} /></div>}
      </div>
    </div>, { width: 1080, height: 1080, headers: { 'Cache-Control': 'no-store' } },
  )
}
