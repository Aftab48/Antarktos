import type { Field, SelectField } from 'payload'

export const region: SelectField = {
  name: 'region',
  type: 'select',
  options: [
    { label: 'Antarctic', value: 'antarctic' },
    { label: 'Arctic', value: 'arctic' },
    { label: 'Southern Ocean', value: 'southern_ocean' },
    { label: 'Himalaya', value: 'himalaya' },
  ],
}

export const year: Field = { name: 'year', type: 'number', min: 1900, max: 2100 }
export const expedition: Field = { name: 'expedition', type: 'relationship', relationTo: 'expeditions' }
export const stations: Field = { name: 'stations', type: 'relationship', relationTo: 'stations', hasMany: true }

// Source and reuse terms, recorded on every archive record (plan §9, §19).
export const provenance: Field[] = [
  { name: 'source_url', label: 'Source URL', type: 'text' },
  { name: 'license', type: 'text' },
  { name: 'credit', type: 'text' },
]

// Written by the processing pipeline (plan §7, §8.1); staff only read them.
export const processing: Field[] = [
  {
    name: 'processing_state',
    label: 'Processing state',
    type: 'select',
    defaultValue: 'queued',
    // Labels match ProcessingState.tsx; they show in the list filter.
    options: [
      { label: 'Queued', value: 'queued' },
      { label: 'Processing', value: 'processing' },
      { label: 'Ready for review', value: 'ready' },
      { label: 'Text layer unavailable', value: 'needs_ocr' },
      { label: 'Processing failed', value: 'failed' },
    ],
    admin: { position: 'sidebar', readOnly: true, components: { Field: '/components/admin/ProcessingField#ProcessingField', Cell: '/components/admin/ProcessingField#ProcessingCell' } },
  },
  // Staff only: a failed query's message carries its parameters, e.g. the text of a draft file.
  { name: 'processing_error', label: 'Processing error', type: 'textarea', access: { read: ({ req }) => Boolean(req.user) }, admin: { position: 'sidebar', readOnly: true } },
]

// True while a summary/caption/alt text is still the AI draft; the pipeline sets it, a human edit clears it.
export const aiGenerated: Field = {
  name: 'ai_generated',
  label: 'AI generated',
  type: 'checkbox',
  defaultValue: false,
  admin: { position: 'sidebar' },
}

// Date-only fields: the picker shows no time and the list shows no "5:30 AM" (Payload pins the stored time to 12:00 UTC).
export const dayOnly = { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } as const
