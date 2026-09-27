import type { CollectionConfig } from 'payload'

import { contentAccess, onlyPublishersPublish } from '../access'
import { guardPipelineFields, removeChunks, startProcessing } from '../pipeline'
import { checkUpload } from '../storage'
import { expedition, processing, provenance, region, stations, year } from './fields'

// Metadata record with an optional PDF (the collection itself is the upload).
export const Publications: CollectionConfig = {
  slug: 'publications',
  admin: { components: { edit: { beforeDocumentControls: ['/components/outreach/GenerateOutreach#GenerateOutreach'] } }, useAsTitle: 'title', defaultColumns: ['title', 'venue', 'year', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [onlyPublishersPublish, checkUpload, guardPipelineFields], afterChange: [startProcessing], afterDelete: [removeChunks] },
  upload: { mimeTypes: ['application/pdf'], filesRequiredOnCreate: false },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'authors', type: 'text', hasMany: true },
    { name: 'venue', type: 'text' },
    year,
    { name: 'doi', type: 'text' },
    { name: 'link', type: 'text', admin: { description: 'Link to the paper (publisher or repository page)' } },
    { name: 'abstract', type: 'textarea', localized: true },
    region,
    expedition,
    stations,
    ...provenance,
    ...processing,
  ],
}
