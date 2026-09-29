import type { CollectionConfig } from 'payload'

import { contentAccess, onlyPublishersPublish } from '../access'
import { guardPipelineFields, removeChunks, startProcessing } from '../pipeline'
import { checkUpload } from '../storage'
import { dayOnly, expedition, processing, provenance, region, stations, year } from './fields'

// DCAT-style metadata plus one optional file or an external link (plan §9). Metadata and download only.
// ponytail: one file per dataset (zip several); add a dataset-files upload collection if records need many.
export const Datasets: CollectionConfig = {
  slug: 'datasets',
  admin: { components: { edit: { beforeDocumentControls: ['/components/outreach/GenerateOutreach#GenerateOutreach'] } }, useAsTitle: 'title', defaultColumns: ['title', 'format', 'year', '_status'] },
  access: contentAccess,
  versions: { drafts: true },
  hooks: { beforeChange: [onlyPublishersPublish, checkUpload, guardPipelineFields], afterChange: [startProcessing], afterDelete: [removeChunks] },
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
    { name: 'temporal_from', label: 'Temporal coverage from', type: 'date', admin: dayOnly },
    { name: 'temporal_to', label: 'Temporal coverage to', type: 'date', admin: dayOnly },
    region,
    year,
    expedition,
    stations,
    {
      name: 'bbox',
      label: 'Bounding box',
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
    { name: 'external_url', label: 'External URL', type: 'text', admin: { description: 'Data portal link, if the file is not uploaded here' } },
    { name: 'doi', label: 'DOI', type: 'text' },
    { name: 'contact', type: 'text' },
    ...provenance,
    ...processing,
  ],
}
