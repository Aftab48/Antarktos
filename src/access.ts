import type { Access, FieldAccess, PayloadRequest } from 'payload'

// Roles (plan §5, §8.2): editors create and edit, reviewers also approve and publish, admins also manage users.
export const canPublish = (req: PayloadRequest) =>
  req.user?.role === 'reviewer' || req.user?.role === 'admin'

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'
export const isAdminField: FieldAccess = ({ req }) => req.user?.role === 'admin'
export const canPublishField: FieldAccess = ({ req }) => canPublish(req)

// Access for every content collection with drafts. The admin UI asks `update` with
// `_status: 'published'` to decide whether to show Publish/Unpublish, so editors don't see them.
// ponytail: an editor could still unpublish through raw REST (PATCH `_status: 'draft'`): access can't
// tell that from a draft save. It only takes content down; add a hook on req.query.draft if it matters.
export const contentAccess: Record<'read' | 'create' | 'update' | 'delete', Access> = {
  // Public reads return published documents only (plan §8.2).
  read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  create: ({ req, data }) => (data?._status === 'published' ? canPublish(req) : Boolean(req.user)),
  update: ({ req, data }) => (data?._status === 'published' ? canPublish(req) : Boolean(req.user)),
  // Editors may delete drafts only.
  delete: ({ req }) => canPublish(req) || (req.user ? { _status: { equals: 'draft' } } : false),
}
