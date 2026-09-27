import type { CollectionConfig } from 'payload'

import { contentAccess } from '../access'
import { removeChunks, startProcessing } from '../pipeline'
import { provenance, region } from './fields'

export const Expeditions: CollectionConfig = {
  slug: 'expeditions',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'region', 'season_start', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  // Indexed for search as one chunk per locale (plan §7, §11).
  hooks: { afterChange: [startProcessing], afterDelete: [removeChunks] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'number', type: 'text' },
    { ...region, required: true },
    // Season years (e.g. 1981 to 1982), as the public sources give them.
    { name: 'season_start', type: 'number', min: 1900, max: 2100 },
    { name: 'season_end', type: 'number', min: 1900, max: 2100 },
    { name: 'leader', type: 'text' },
    { name: 'stations', type: 'relationship', relationTo: 'stations', hasMany: true },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'highlights', type: 'array', localized: true, fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    ...provenance,
  ],
}
