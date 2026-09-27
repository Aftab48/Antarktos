// Day-1 check (b): read the R2 bucket CORS rules, show which query params a presigned PUT carries,
// and (with --head <key>) check whether one object exists. No bucket listing, no uploads.
// Run: node --env-file=.env scripts/day1/r2-check.mjs [--head <key>]
import { S3Client, GetBucketCorsCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const base = {
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
}
const Bucket = process.env.R2_BUCKET
const headKey = process.argv[process.argv.indexOf('--head') + 1]

if (process.argv.includes('--head')) {
  const s3 = new S3Client(base)
  try {
    const r = await s3.send(new HeadObjectCommand({ Bucket, Key: headKey }))
    console.log(JSON.stringify({ key: headKey, exists: true, size: r.ContentLength, type: r.ContentType, storageClass: r.StorageClass ?? 'STANDARD' }))
  } catch (e) {
    console.log(JSON.stringify({ key: headKey, exists: false, status: e.$metadata?.httpStatusCode }))
  }
  process.exit(0)
}

const s3 = new S3Client(base)
try {
  const cors = await s3.send(new GetBucketCorsCommand({ Bucket }))
  console.log('CORS rules:', JSON.stringify(cors.CORSRules, null, 2))
} catch (e) {
  console.log('CORS read failed:', e.name, e.$metadata?.httpStatusCode, e.message)
}

// Presigning happens locally (no request is sent).
for (const [label, extra] of [['sdk default', {}], ['WHEN_REQUIRED', { requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' }]]) {
  const url = await getSignedUrl(new S3Client({ ...base, ...extra }),
    new PutObjectCommand({ Bucket, Key: 'day1/probe.pdf', ContentType: 'application/pdf', IfNoneMatch: '*' }),
    { expiresIn: 60, signableHeaders: new Set(['content-type']) })
  const u = new URL(url)
  console.log(label, '→ host:', u.host.replace(process.env.R2_ACCOUNT_ID, '<account>'), 'params:', [...u.searchParams.keys()].join(', '))
}
