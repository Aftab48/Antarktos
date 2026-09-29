import type { CollectionConfig } from 'payload'

import { contentAccess, onlyPublishersPublish } from '../access'
import { guardPipelineFields, removeChunks, startProcessing } from '../pipeline'
import { checkUpload } from '../storage'
import { aiGenerated, expedition, processing, provenance, region, stations, year } from './fields'

// A report is its PDF plus metadata: the collection itself is the upload (plan §16 "file (PDF upload)").
export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: { components: { edit: { beforeDocumentControls: ['/components/outreach/GenerateOutreach#GenerateOutreach'] } }, useAsTitle: 'title', defaultColumns: ['title', 'report_type', 'year', '_status', 'processing_state'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [onlyPublishersPublish, checkUpload, guardPipelineFields], afterChange: [startProcessing], afterDelete: [removeChunks] },
  upload: { mimeTypes: ['application/pdf'] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'report_type',
      label: 'Report type',
      type: 'select',
      defaultValue: 'expedition',
      options: [
        { label: 'Expedition', value: 'expedition' },
        { label: 'Annual', value: 'annual' },
        { label: 'Technical', value: 'technical' },
        { label: 'Other', value: 'other' },
      ],
    },
    region,
    expedition,
    stations,
    year,
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'keywords', type: 'text', hasMany: true },
    { name: 'page_count', label: 'Page count', type: 'number', admin: { readOnly: true } },
    ...provenance,
    ...processing,
    aiGenerated,
  ],
}
