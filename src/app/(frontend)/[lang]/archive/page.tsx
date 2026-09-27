import type { Metadata } from 'next'
import type { Where } from 'payload'

import { Button } from '@/components/ui/button'
import { formatNumber, href, translator } from '@/i18n'

import { find, isRecordType, pageLocale, RECORD_SORT, RECORD_TYPES, REGIONS, text, type Doc, type Params, type RecordType } from '../../_lib/data'
import { h1, h2, label, LinkedRecords, RecordGrid } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('archive.title') }
}

const PAGE_SIZE = 24
type Search = Promise<Record<string, string | string[] | undefined>>

// Filters from the query string; anything malformed is ignored.
function readFilters(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const id = (k: string) => (/^\d{1,9}$/.test(one(k)) ? Number(one(k)) : undefined)
  return {
    type: isRecordType(one('type')) ? (one('type') as RecordType) : undefined,
    region: (REGIONS as readonly string[]).includes(one('region')) ? one('region') : undefined,
    year: /^\d{4}$/.test(one('year')) ? Number(one('year')) : undefined,
    expedition: id('expedition'),
    station: id('station'),
    page: Math.min(Math.max(id('page') ?? 1, 1), 1000),
  }
}
type Filters = ReturnType<typeof readFilters>

// Media and events have dates instead of a year field.
function whereFor(type: RecordType, f: Filters): Where {
  const and: Where[] = []
  if (f.region) and.push({ region: { equals: f.region } })
  if (f.expedition) and.push({ expedition: { equals: f.expedition } })
  if (f.station) and.push({ stations: { in: [f.station] } })
  if (f.year) {
    const field = type === 'events' ? 'date' : type === 'media' ? 'taken_at' : null
    and.push(field ? { [field]: { greater_than_equal: `${f.year}-01-01`, less_than: `${f.year + 1}-01-01` } } : { year: { equals: f.year } })
  }
  return and.length ? { and } : {}
}

const query = (f: Partial<Filters>) =>
  new URLSearchParams(Object.entries(f).flatMap(([k, v]) => (v ? [[k, String(v)]] : []))).toString()

export default async function Archive({ params, searchParams }: { params: Params; searchParams: Search }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const f = readFilters(await searchParams)
  const { page, type, ...rest } = f
  const [expeditions, stations, results] = await Promise.all([
    find('expeditions', { sort: 'season_start', limit: 0 }),
    find('stations', { sort: 'established', limit: 0 }),
    type
      ? find(type, { where: whereFor(type, f), sort: RECORD_SORT[type], limit: PAGE_SIZE, page })
      : Promise.all(RECORD_TYPES.map((c) => find(c, { where: whereFor(c, f), sort: RECORD_SORT[c], limit: 6 }))),
  ])
  // One type: a paginated list. All types: a few of each, with a link to see all of that type.
  const list = Array.isArray(results) ? null : results
  const groups = Array.isArray(results) ? RECORD_TYPES.map((c, i) => ({ type: c, docs: results[i].docs as Doc[], total: results[i].totalDocs })) : []
  const total = list ? list.totalDocs : groups.reduce((n, g) => n + g.total, 0)
  const select = 'mt-1 block w-full rounded-md border bg-background px-2 py-1.5 text-sm'

  return (
    <>
      <h1 className={h1}>{t('archive.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('archive.intro')}</p>
      {/* Step 6: keyword search (GET /api/search) joins these filters here. */}

      <form method="get" action={href(l, '/archive')} className="mt-6 rounded-xl border p-4" aria-labelledby="filters-h">
        <h2 id="filters-h" className="sr-only">{t('archive.filters')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium">
            {t('field.type')}
            <select name="type" defaultValue={type ?? ''} className={select}>
              <option value="">{t('archive.all')}</option>
              {RECORD_TYPES.map((c) => (
                <option key={c} value={c}>{t(`type.${c}`)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t('field.region')}
            <select name="region" defaultValue={f.region ?? ''} className={select}>
              <option value="">{t('archive.all')}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{label(l, 'region', r)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t('field.year')}
            <input name="year" type="number" inputMode="numeric" min={1900} max={2100} defaultValue={f.year ?? ''} className={select} />
          </label>
          <label className="text-sm font-medium">
            {t('field.expedition')}
            <select name="expedition" defaultValue={f.expedition ?? ''} className={select}>
              <option value="">{t('archive.all')}</option>
              {expeditions.docs.map((d: Doc) => (
                <option key={d.id} value={d.id}>{text(d.title, l)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t('field.stations')}
            <select name="station" defaultValue={f.station ?? ''} className={select}>
              <option value="">{t('archive.all')}</option>
              {stations.docs.map((d: Doc) => (
                <option key={d.id} value={d.id}>{text(d.name, l)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button type="submit">{t('archive.apply')}</Button>
          <a href={href(l, '/archive')} className="text-sm underline underline-offset-4">{t('archive.reset')}</a>
        </div>
      </form>

      <section aria-labelledby="results-h" className="mt-10">
        <h2 id="results-h" className={h2}>{t('archive.results', { count: formatNumber(l, total) })}</h2>
        {!list || !type ? (
          <LinkedRecords groups={groups} l={l} archiveQuery={query(rest)} empty={t('archive.empty')} />
        ) : total === 0 ? (
          <p className="text-muted-foreground">{t('archive.empty')}</p>
        ) : (
          <>
            <RecordGrid type={type} docs={list.docs as Doc[]} l={l} />
            {list.totalPages > 1 && (
              <nav aria-label={t('archive.pageOf', { page, total: list.totalPages })} className="mt-8 flex items-center justify-between gap-4 text-sm">
                {list.hasPrevPage ? (
                  <a href={href(l, `/archive?${query({ ...f, page: page - 1 })}`)} className="underline underline-offset-4">{t('archive.prev')}</a>
                ) : <span />}
                <span className="text-muted-foreground">{t('archive.pageOf', { page, total: list.totalPages })}</span>
                {list.hasNextPage ? (
                  <a href={href(l, `/archive?${query({ ...f, page: page + 1 })}`)} className="underline underline-offset-4">{t('archive.next')}</a>
                ) : <span />}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  )
}
