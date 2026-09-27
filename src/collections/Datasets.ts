import type { CollectionConfig } from 'payload'

import { contentAccess } from '../access'
import { checkUpload } from '../storage'
import { expedition, processing, provenance, region, stations, year } from './fields'

// DCAT-style metadata plus one optional file or an external link (plan §9). Metadata and download only.
// ponytail: one file per dataset (zip several); add a dataset-files upload collection if records need many.
export const Datasets: CollectionConfig = {
  slug: 'datasets',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'format', 'year', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [checkUpload] },
  upload: {
    mimeTypes: [
      'text/csv',
      'text/plain',
      'text/tab-separated-values',
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x-netcdf',
      'application/netcdf',
      'application/x-hdf',
      'application/x-hdf5',
      'application/pdf',
    ],
    filesRequiredOnCreate: false,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'abstract', type: 'textarea', localized: true },
    { name: 'keywords', type: 'text', hasMany: true },
    { name: 'parameters', type: 'text', hasMany: true, admin: { description: 'Parameters measured' } },
    { name: 'temporal_from', type: 'date' },
    { name: 'temporal_to', type: 'date' },
    region,
    year,
    expedition,
    stations,
    {
      name: 'bbox',
      type: 'group',
      admin: { description: 'Spatial coverage in decimal degrees, if wider than the stations' },
      fields: [
        { name: 'west', type: 'number', min: -180, max: 180 },
        { name: 'south', type: 'number', min: -90, max: 90 },
        { name: 'east', type: 'number', min: -180, max: 180 },
        { name: 'north', type: 'number', min: -90, max: 90 },
      ],
    },
    { name: 'format', type: 'text' },
    { name: 'external_url', type: 'text', admin: { description: 'Data portal link, if the file is not uploaded here' } },
    { name: 'doi', type: 'text' },
    { name: 'contact', type: 'text' },
    ...provenance,
    ...processing,
  ],
}
