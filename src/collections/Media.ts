import type { CollectionConfig } from 'payload'

import { contentAccess } from '../access'
import { guardPipelineFields, removeChunks, startProcessing } from '../pipeline'
import { checkUpload } from '../storage'
import { aiGenerated, expedition, processing, provenance, region, stations } from './fields'

// Photos and short video clips; long videos are YouTube links (plan §6.1, §9).
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename', defaultColumns: ['filename', 'alt', '_status', 'processing_state'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [checkUpload, guardPipelineFields], afterChange: [startProcessing], afterDelete: [removeChunks] },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    // A media record can be just a YouTube link.
    filesRequiredOnCreate: false,
    // Resized once on upload; public pages use these, not the original (plan §6.3).
    imageSizes: [
      { name: 'thumbnail', width: 400, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1024, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'youtube_url',
      type: 'text',
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { filename?: string } }) => {
        if (value && !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(value)) return 'Use a https://youtube.com or https://youtu.be link'
        return value || siblingData.filename ? true : 'Upload a file or add a YouTube URL'
      },
    },
    { name: 'caption', type: 'textarea', localized: true },
    { name: 'alt', type: 'text', localized: true, required: true, maxLength: 250 },
    { name: 'tags', type: 'text', hasMany: true },
    region,
    expedition,
    stations,
    { name: 'taken_at', type: 'date' },
    { name: 'lat', type: 'number', min: -90, max: 90 },
    { name: 'lng', type: 'number', min: -180, max: 180 },
    ...provenance,
    ...processing,
    aiGenerated,
  ],
}
