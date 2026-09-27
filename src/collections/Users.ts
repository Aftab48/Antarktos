import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
  },
  auth: true,
  access: {
    // Any logged-in staff member may read users (reviewed_by shows a name); only admins manage them.
    create: isAdmin,
    update: ({ req }) => req.user?.role === 'admin' || (req.user ? { id: { equals: req.user.id } } : false),
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      // The very first account (admin panel "create first user") is always an admin, so nobody gets locked out.
      async ({ data, operation, req }) => {
        if (operation === 'create' && (await req.payload.count({ collection: 'users', req })).totalDocs === 0) {
          data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Reviewer', value: 'reviewer' },
      ],
      access: { create: isAdminField, update: isAdminField },
    },
  ],
}
