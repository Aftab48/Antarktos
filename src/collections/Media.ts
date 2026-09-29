import type { CollectionConfig } from 'payload'

import { contentAccess, onlyPublishersPublish } from '../access'
import { guardPipelineFields, removeChunks, startProcessing } from '../pipeline'
import { checkUpload } from '../storage'
import { aiGenerated, dayOnly, expedition, processing, provenance, region, stations } from './fields'

type StoredMedia = { filename?: string | null; mimeType?: string | null; prefix?: string | null; _objectKey?: string | null; sizes?: { thumbnail?: { filename?: string | null } | null } | null }

// Payload builds admin thumbnails from its /api/media/file proxy, which is off because files are served from
// R2 (those requests 500). Use the R2 URL instead, built like generateFileURL in payload.config.ts.
export function r2Thumbnail({ doc }: { doc: Record<string, unknown> }): string | null {
  const d = doc as StoredMedia
  const file = d.sizes?.thumbnail?.filename || (d.mimeType?.startsWith('image/') ? d.filename : null)
  return file ? [process.env.R2_PUBLIC_URL, d.prefix, d._objectKey, encodeURIComponent(file)].filter(Boolean).join('/') : null
}

// Photos and short video clips; long videos are YouTube links (plan §6.1, §9).
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { components: { edit: { beforeDocumentControls: ['/components/outreach/GenerateOutreach#GenerateOutreach'] } }, useAsTitle: 'filename', defaultColumns: ['filename', 'alt', '_status', 'processing_state'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [onlyPublishersPublish, checkUpload, guardPipelineFields], afterChange: [startProcessing], afterDelete: [removeChunks] },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    // A media record can be just a YouTube link.
    filesRequiredOnCreate: false,
    // Resized once on upload; public pages use these, not the original (plan §6.3).
    imageSizes: [
      { name: 'thumbnail', width: 400, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1024, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: r2Thumbnail,
  },
  fields: [
    {
      name: 'youtube_url',
      label: 'YouTube URL',
      type: 'text',
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { filename?: string } }) => {
        if (value && !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(value)) return 'Use a https://youtube.com or https://youtu.be link'
        return value || siblingData.filename ? true : 'Upload a file or add a YouTube URL'
      },
    },
    { name: 'caption', type: 'textarea', localized: true },
    { name: 'alt', label: 'Alt text', type: 'text', localized: true, required: true, maxLength: 250 },
    { name: 'tags', type: 'text', hasMany: true },
    region,
    expedition,
    stations,
    { name: 'taken_at', label: 'Date taken', type: 'date', admin: dayOnly },
    { name: 'lat', label: 'Latitude', type: 'number', min: -90, max: 90 },
    { name: 'lng', label: 'Longitude', type: 'number', min: -180, max: 180 },
    ...provenance,
    ...processing,
    aiGenerated,
  ],
}
