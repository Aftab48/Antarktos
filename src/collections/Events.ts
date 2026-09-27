import type { CollectionConfig } from 'payload'

import { contentAccess } from '../access'
import { expedition, processing, provenance, region, stations } from './fields'

// Institutional activities (plan §9).
export const Events: CollectionConfig = {
  slug: 'events',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'event_type', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'date', type: 'date' },
    {
      name: 'event_type',
      type: 'select',
      options: [
        { label: 'Workshop', value: 'workshop' },
        { label: 'School outreach', value: 'school_outreach' },
        { label: 'Launch', value: 'launch' },
        { label: 'Flag-off', value: 'flag_off' },
        { label: 'Conference', value: 'conference' },
        { label: 'Visit', value: 'visit' },
      ],
    },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'location', type: 'text' },
    { name: 'media', type: 'upload', relationTo: 'media', hasMany: true },
    region,
    expedition,
    stations,
    ...provenance,
    ...processing,
  ],
}
