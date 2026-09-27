import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Datasets } from './collections/Datasets'
import { Events } from './collections/Events'
import { Expeditions } from './collections/Expeditions'
import { Media } from './collections/Media'
import { OutreachPosts } from './collections/OutreachPosts'
import { Publications } from './collections/Publications'
import { Reports } from './collections/Reports'
import { Stations } from './collections/Stations'
import { Users } from './collections/Users'
import { guardClientUploads } from './storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Files are served straight from R2's public URL, never proxied through a function
// (Vercel caps response bodies at 4.5 MB; plan §15).
const r2Collection = {
  disablePayloadAccessControl: true as const,
  generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
    [process.env.R2_PUBLIC_URL, prefix, encodeURIComponent(filename)].filter(Boolean).join('/'),
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['/components/StorageBudget#StorageBudget'],
    },
  },
  collections: [Users, Expeditions, Stations, Reports, Datasets, Publications, Media, Events, OutreachPosts],
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'हिन्दी', code: 'hi' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  // Largest per-file limit (plan §6.3). With a limit set, presigned PUTs also sign Content-Length,
  // so R2 rejects a body bigger than the size the browser declared. Per-type limits: src/storage.ts.
  upload: { limits: { fileSize: 100 * 1024 * 1024 } },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Schema changes go through migrations (src/migrations), never dev-mode push.
    push: false,
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: { media: r2Collection, reports: r2Collection, publications: r2Collection, datasets: r2Collection },
      bucket: process.env.R2_BUCKET || '',
      // Browser PUTs straight to R2 via a presigned URL, so files skip Vercel's 4.5 MB body limit.
      clientUploads: true,
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        // Otherwise the SDK signs a CRC32 of an empty body into presigned PUT URLs.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      },
    }),
    // Type, size and 8 GB budget checks before any presigned upload URL is issued (plan §6.3).
    guardClientUploads,
  ],
})
