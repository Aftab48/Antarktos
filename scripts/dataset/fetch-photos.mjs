// Fetch openly licensed polar photos from Wikimedia Commons for the demo archive.
// Node only, no new dependencies. Polite: batched imageinfo calls + delays between requests.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  USER_AGENT,
  classifyLicense,
  fetchWithRetry,
  getImageInfo,
  hasGps,
  searchFiles,
  sleep,
  stripHtml,
} from './lib/commons.mjs'
import { writeCsv } from './lib/csv.mjs'

const QUERIES = [
  'Maitri station',
  'Bharati station Antarctica',
  'Himadri station Svalbard',
  'Indian Antarctic expedition',
  'Larsemann Hills',
  'Schirmacher Oasis',
  'Antarctic research vessel',
  'Antarctic ice core',
  'Ny-Ålesund',
  'Himalayan glacier research',
]

const PER_QUERY_TARGET = 15 // 10 queries x 15 ~= 150, matching the ~100-150 total target
const SEARCH_LIMIT = 60 // search pool per query before license/mime filtering
const API_DELAY_MS = 800 // between Commons API calls
const DOWNLOAD_DELAY_MS = 250 // between image downloads
// Only keep genuine photo formats; skip diagrams/logos/maps that show up as SVG, and
// skip non-image File-namespace hits (video/audio/pdf).
const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function slugify(q) {
  return q
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function downloadImage(url, dest) {
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

async function collectForQuery(query, outRoot) {
  const slug = slugify(query)
  const dir = path.join(outRoot, slug)
  await mkdir(dir, { recursive: true })

  const titles = await searchFiles(query, SEARCH_LIMIT)
  await sleep(API_DELAY_MS)

  const rows = []
  let rejected = 0
  let skippedMime = 0

  for (let i = 0; i < titles.length && rows.length < PER_QUERY_TARGET; i += 50) {
    const batch = titles.slice(i, i + 50)
    const infos = await getImageInfo(batch)
    await sleep(API_DELAY_MS)

    for (const { title, info } of infos) {
      if (rows.length >= PER_QUERY_TARGET) break
      if (!PHOTO_MIME.has(info.mime ?? '')) {
        skippedMime += 1
        continue
      }
      const license = classifyLicense(info.extmetadata?.LicenseShortName?.value)
      if (!license) {
        rejected += 1
        continue
      }

      const filename = title.replace(/^File:/, '')
      const dest = path.join(dir, filename)
      try {
        await downloadImage(info.url, dest)
      } catch (err) {
        console.warn(`  skip ${filename}: download failed (${err.message})`)
        continue
      }
      await sleep(DOWNLOAD_DELAY_MS)

      const creator = stripHtml(info.extmetadata?.Artist?.value)
      const attribution = stripHtml(info.extmetadata?.Credit?.value) || creator
      const takenAt = stripHtml(info.extmetadata?.DateTimeOriginal?.value ?? info.extmetadata?.DateTime?.value)

      rows.push({
        file: `${slug}/${filename}`,
        query,
        source_url: info.descriptionurl ?? '',
        creator,
        license,
        attribution,
        taken_at: takenAt,
        has_gps: hasGps(info) ? 'true' : 'false',
      })
    }
  }
  return { query, slug, rows, searched: titles.length, rejected, skippedMime }
}

async function main() {
  const outRoot = path.resolve('data/photos')
  await mkdir(outRoot, { recursive: true })

  const allRows = []
  const perQuery = []
  for (const query of QUERIES) {
    console.log(`Fetching: ${query}`)
    const result = await collectForQuery(query, outRoot)
    allRows.push(...result.rows)
    perQuery.push(result)
    console.log(
      `  kept ${result.rows.length} (searched ${result.searched}, license-rejected ${result.rejected}, non-photo ${result.skippedMime})`,
    )
  }

  await writeCsv(
    path.join(outRoot, 'manifest.csv'),
    ['file', 'query', 'source_url', 'creator', 'license', 'attribution', 'taken_at', 'has_gps'],
    allRows,
  )

  const withDate = allRows.filter((r) => r.taken_at).length
  const withGps = allRows.filter((r) => r.has_gps === 'true').length
  const byLicense = {}
  for (const r of allRows) byLicense[r.license] = (byLicense[r.license] ?? 0) + 1

  console.log('\n=== Photo collection summary ===')
  console.log(`Total kept: ${allRows.length}`)
  console.log(`With a date: ${withDate}  |  With GPS: ${withGps}`)
  console.log('By license:', byLicense)
  console.log('Per query (kept / searched):')
  for (const r of perQuery) {
    const flag = r.rows.length < PER_QUERY_TARGET * 0.5 ? '  <-- low yield, check relevance by hand' : ''
    console.log(`  ${r.query}: ${r.rows.length} / ${r.searched}${flag}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
