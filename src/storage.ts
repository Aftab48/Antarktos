import { sql } from '@payloadcms/db-postgres'
import type { CollectionBeforeChangeHook, CollectionSlug, Config, Payload, PayloadHandler } from 'payload'
import { APIError, Forbidden } from 'payload'
import { validateMimeType } from 'payload/shared'

// R2 bills a card past the free 10 GB, so the app keeps its own budget (plan §6.3).
export const STORAGE_BUDGET_BYTES = 8_000_000_000
const MB = 1024 * 1024

// Per-file limits by type (plan §6.3): PDF 50 MB, image 15 MB, dataset and video files 100 MB.
export function fileSizeLimit(mimeType: string): number {
  if (mimeType === 'application/pdf') return 50 * MB
  if (mimeType.startsWith('image/')) return 15 * MB
  return 100 * MB
}

// Upload tables and the column prefixes of each stored file (original + image sizes).
const FILE_COLUMNS: Record<string, string[]> = {
  media: ['', 'sizes_thumbnail_', 'sizes_large_'],
  reports: [''],
  publications: [''],
  datasets: [''],
}

// Sum of stored bytes, from the database only (never by listing the bucket). Versions count too:
// a file uploaded in a draft over a published doc lives only in the versions table.
// union (not union all) counts a file once when the main row and its versions point at it.
// ponytail: objects from abandoned client uploads (URL signed, doc never saved) aren't counted;
// the 2 GB gap between the 8 GB budget and the 10 GB free tier absorbs them.
const USED_SQL = `select coalesce(sum(s), 0)::bigint as used from (${Object.entries(FILE_COLUMNS)
  .flatMap(([t, prefixes]) =>
    prefixes.flatMap((p) => [
      `select '${t}' as t, _objectkey as k, ${p}filename as f, ${p}filesize as s from ${t} where ${p}filename is not null`,
      `select '${t}', version__objectkey, version_${p}filename, version_${p}filesize from _${t}_v where version_${p}filename is not null`,
    ]),
  )
  .join(' union ')}) files`

export async function storageUsedBytes(payload: Payload): Promise<number> {
  const { rows } = await payload.db.drizzle.execute(sql.raw(USED_SQL))
  return Number(rows[0].used)
}

const fmt = (bytes: number) => `${(bytes / MB).toFixed(1)} MB`

export async function assertUploadAllowed(
  payload: Payload,
  collectionSlug: unknown,
  mimeType: unknown,
  filesize: unknown,
  budget = STORAGE_BUDGET_BYTES,
) {
  const upload = typeof collectionSlug === 'string' ? payload.collections[collectionSlug as CollectionSlug]?.config.upload : undefined
  if (!upload || typeof upload !== 'object') throw new APIError('This collection does not take uploads.', 400, undefined, true)
  if (typeof mimeType !== 'string' || !mimeType || !validateMimeType(mimeType, upload.mimeTypes ?? [])) {
    throw new APIError(`File type "${mimeType}" is not allowed here. Allowed: ${(upload.mimeTypes ?? []).join(', ')}.`, 400, undefined, true)
  }
  if (typeof filesize !== 'number' || !Number.isSafeInteger(filesize) || filesize < 0) {
    throw new APIError('A valid file size is required.', 400, undefined, true)
  }
  const limit = fileSizeLimit(mimeType)
  if (filesize > limit) throw new APIError(`File is too large: ${fmt(filesize)}, limit ${fmt(limit)} for ${mimeType}.`, 400, undefined, true)
  const used = await storageUsedBytes(payload)
  if (used + filesize > budget) {
    throw new APIError(
      `Storage budget reached: ${(used / 1e9).toFixed(2)} GB of ${(budget / 1e9).toFixed(2)} GB used, this file needs ${fmt(filesize)}. Delete unused files or ask an admin.`,
      400, undefined, true,
    )
  }
}

// Server-side uploads (Local API, multipart) go through the same checks before the file reaches R2.
export const checkUpload: CollectionBeforeChangeHook = async ({ collection, data, req }) => {
  if (req.file) await assertUploadAllowed(req.payload, collection.slug, data.mimeType, data.filesize)
  return data
}

// Browser uploads: check type, size and budget before the presigned R2 URL is issued.
const SIGNED_URL_PATH = '/storage-s3-generate-signed-url'
export const guardClientUploads = (config: Config): Config => ({
  ...config,
  endpoints: (config.endpoints ?? []).map((endpoint) => {
    if (endpoint.path !== SIGNED_URL_PATH) return endpoint
    const handler: PayloadHandler = async (req) => {
      if (!req.user) throw new Forbidden(req.t)
      const body = await req.json!()
      await assertUploadAllowed(req.payload, body?.collectionSlug, body?.mimeType, body?.filesize)
      req.json = async () => body // the original handler reads the body again
      return endpoint.handler(req)
    }
    return { ...endpoint, handler }
  }),
})
