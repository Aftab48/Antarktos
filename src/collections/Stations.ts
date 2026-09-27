import type { CollectionConfig } from 'payload'

import { contentAccess } from '../access'
import { provenance, region } from './fields'

export const Stations: CollectionConfig = {
  slug: 'stations',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'region', 'operational_status', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { ...region, required: true },
    { name: 'lat', type: 'number', min: -90, max: 90 },
    { name: 'lng', type: 'number', min: -180, max: 180 },
    { name: 'established', type: 'number', min: 1900, max: 2100 },
    { name: 'decommissioned', type: 'number', min: 1900, max: 2100 },
    // Not `status`: that name collides with the drafts `_status` enum in Postgres.
    { name: 'operational_status', type: 'select', options: ['active', 'historical'], defaultValue: 'active' },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    ...provenance,
  ],
}
