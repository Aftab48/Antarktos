import type { Access, CollectionConfig, FieldAccess } from 'payload'

import { canPublishField, contentAccess, onlyPublishersPublish } from '../access'
import { guardOutreach, staffRole } from '../outreach/access'

const reviewerOnly = { create: canPublishField, update: canPublishField }
// Internal review data: the public API and public pages never see it (only reviewed_at is shown, plan §14).
const staffRead = { read: (({ req }) => staffRole(req.user?.role)) as FieldAccess }

// One generated item per platform and language (plan §10, §16). English and Hindi posts are
// separate documents reviewed separately, so this collection uses `language`, not localization.
export const OutreachPosts: CollectionConfig = {
  slug: 'outreach-posts',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'platform', 'language', 'review_status', '_status'] },
  access: {
    ...contentAccess,
    read: (({ req }) => staffRole(req.user?.role) ? true : { _status: { equals: 'published' }, review_status: { equals: 'approved' } }) as Access,
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [
      onlyPublishersPublish,
      guardOutreach,
    ],
  },
  fields: [
    { name: 'outreachReviewPreview', type: 'ui', admin: { components: { Field: '/components/outreach/ReviewPreview#ReviewPreview' } } },
    {
      name: 'source',
      type: 'relationship',
      relationTo: ['reports', 'datasets', 'publications', 'media', 'events', 'expeditions', 'stations'],
      required: true,
    },
    { name: 'sources', label: 'Cited records', type: 'relationship', hasMany: true, relationTo: ['reports', 'datasets', 'publications', 'media', 'events', 'expeditions', 'stations'], admin: { readOnly: true } },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Blog', value: 'blog' },
        { label: 'X', value: 'x' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Press note', value: 'press_note' },
        { label: 'Student explainer', value: 'student_explainer' },
      ],
    },
    { name: 'language', type: 'select', required: true, options: [{ label: 'English', value: 'en' }, { label: 'हिन्दी', value: 'hi' }] },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea', required: true },
    { name: 'dateline', type: 'text' },
    { name: 'about', label: 'About (press note)', type: 'textarea' },
    {
      name: 'topic',
      type: 'select',
      options: [
        { label: 'Ice', value: 'ice' },
        { label: 'Climate', value: 'climate' },
        { label: 'Oceans', value: 'oceans' },
        { label: 'Life in Antarctica', value: 'life_in_antarctica' },
        { label: 'Stations', value: 'stations' },
        { label: 'Expeditions', value: 'expeditions' },
      ],
    },
    { name: 'thread', label: 'Thread posts', type: 'array', fields: [{ name: 'text', type: 'textarea', required: true }] },
    { name: 'hashtags', type: 'text', hasMany: true },
    {
      name: 'quiz',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'options', type: 'text', hasMany: true, minRows: 4, maxRows: 4, required: true },
        { name: 'answer_index', label: 'Correct option (0–3)', type: 'number', min: 0, max: 3, required: true },
        { name: 'explanation', type: 'textarea' },
        { name: 'chunk_id', label: 'Cited chunk', type: 'number' },
      ],
    },
    { name: 'suggested_media', label: 'Suggested photo', type: 'upload', relationTo: 'media' },
    { name: 'cited_chunk_ids', label: 'Cited chunks', type: 'number', hasMany: true, admin: { readOnly: true } },
    // Pass/fail check list for the reviewer (plan §10.3). Never a numeric confidence.
    { name: 'checks', type: 'json', access: staffRead, admin: { readOnly: true, hidden: true } },
    { name: 'check_issues', label: 'Check issues', type: 'text', hasMany: true, admin: { readOnly: true }, access: { read: ({ req }) => staffRole(req.user?.role) } },
    { name: 'generation_request_id', label: 'Generation request', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' }, access: { read: ({ req }) => staffRole(req.user?.role) } },
    { name: 'model', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'prompt_version', label: 'Prompt version', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    // Only reviewers and admins approve (plan §8.2).
    {
      name: 'review_status',
      label: 'Review status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: reviewerOnly,
      admin: { position: 'sidebar' },
    },
    { name: 'reviewed_by', label: 'Reviewed by', type: 'relationship', relationTo: 'users', access: { ...reviewerOnly, ...staffRead }, admin: { position: 'sidebar', readOnly: true } },
    { name: 'reviewed_at', label: 'Reviewed at', type: 'date', access: reviewerOnly, admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' } } },
    { name: 'review_note', label: 'Review note', type: 'textarea', access: { ...reviewerOnly, ...staffRead }, admin: { position: 'sidebar' } },
  ],
}
