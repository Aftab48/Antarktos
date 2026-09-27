// Adds photos of India's polar stations from exact Wikimedia Commons categories (keyword search missed them).
// Skips files already kept in data/photos or rejected into data/photos-rejected; appends to the manifest.
import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { USER_AGENT, categoryFiles, classifyLicense, fetchWithRetry, getImageInfo, hasGps, sleep, stripHtml } from './lib/commons.mjs'
import { appendCsv } from './lib/csv.mjs'

const CATEGORIES = {
  'Category:Maitri Station': 'maitri-station',
  'Category:Bharati Station': 'bharati-station-antarctica',
  'Category:Dakshin Gangotri': 'dakshin-gangotri',
  'Category:Indian expeditions to Antarctica': 'indian-antarctic-expedition',
  'Category:Sagar Nidhi (ship, 2007)': 'antarctic-research-vessel',
}
const HEADERS = ['file', 'query', 'source_url', 'creator', 'license', 'attribution', 'taken_at', 'has_gps']
const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const API_DELAY_MS = 800
const DOWNLOAD_DELAY_MS = 250

async function namesUnder(dir) {
  if (!existsSync(dir)) return new Set()
  const out = new Set()
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (d.isDirectory()) for (const f of await readdir(path.join(dir, d.name))) out.add(f)
  }
  return out
}

async function main() {
  const root = path.resolve('data/photos')
  const known = new Set([...(await namesUnder(root)), ...(await namesUnder(path.resolve('data/photos-rejected')))])
  const rows = []
  for (const [category, slug] of Object.entries(CATEGORIES)) {
    const titles = (await categoryFiles(category)).filter((t) => !known.has(t.replace(/^File:/, '')))
    await sleep(API_DELAY_MS)
    const dir = path.join(root, slug)
    await mkdir(dir, { recursive: true })
    let kept = 0, skipped = 0
    for (let i = 0; i < titles.length; i += 50) {
      const infos = await getImageInfo(titles.slice(i, i + 50))
      await sleep(API_DELAY_MS)
      for (const { title, info } of infos) {
        const license = classifyLicense(info.extmetadata?.LicenseShortName?.value)
        if (!PHOTO_MIME.has(info.mime ?? '') || !license) { skipped++; continue }
        const filename = title.replace(/^File:/, '')
        const res = await fetchWithRetry(info.url, { headers: { 'User-Agent': USER_AGENT } })
        if (!res.ok) { skipped++; continue }
        await writeFile(path.join(dir, filename), Buffer.from(await res.arrayBuffer()))
        await sleep(DOWNLOAD_DELAY_MS)
        known.add(filename)
        kept++
        const creator = stripHtml(info.extmetadata?.Artist?.value)
        rows.push({
          file: `${slug}/${filename}`,
          query: category,
          source_url: info.descriptionurl ?? '',
          creator,
          license,
          attribution: stripHtml(info.extmetadata?.Credit?.value) || creator,
          taken_at: stripHtml(info.extmetadata?.DateTimeOriginal?.value ?? info.extmetadata?.DateTime?.value),
          has_gps: hasGps(info) ? 'true' : 'false',
        })
      }
    }
    console.log(`${category}: added ${kept}, skipped ${skipped} (non-photo or license)`)
  }
  await appendCsv(path.join(root, 'manifest.csv'), HEADERS, rows)
  console.log(`Total added: ${rows.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
