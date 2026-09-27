// Shared pieces of the public pages. All text is rendered as plain text (React escapes it), never as HTML:
// summaries and captions are AI-written (step 4b note).
import type { ElementType, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber, formatYear, href, translator, type Key, type Locale } from '@/i18n'
import { citedIds, stripMarkers } from '@/pipeline/text'

import { citedPages, pick, rel, safeUrl, type Doc, type RecordType } from './data'

// Localized text; marks `lang` when it isn't the page's language (a Hindi page showing English content).
export function L({ v, l, as: Tag = 'span', className }: { v: unknown; l: Locale; as?: ElementType; className?: string }) {
  const p = pick(v, l)
  if (!p) return null
  return (
    <Tag className={className} lang={p.lang === l ? undefined : p.lang}>
      {String(p.value)}
    </Tag>
  )
}

// Non-localized text (names, keywords, journal titles) is English: marked as such on Hindi pages.
export const en = (l: Locale, v: ReactNode) => (v ? <span lang={l === 'en' ? undefined : 'en'}>{v}</span> : undefined)

// A textarea field: one <p> per paragraph.
export function Paragraphs({ v, l, className }: { v: unknown; l: Locale; className?: string }) {
  const p = pick(v, l)
  if (!p) return null
  return (
    <div className={className} lang={p.lang === l ? undefined : p.lang}>
      {p.value.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}

// True when any of these localized values is shown in the other language (a notice goes on top of the page).
export const fallsBack = (l: Locale, ...values: unknown[]) => values.some((v) => { const p = pick(v, l); return p != null && p.lang !== l })

export function FallbackNote({ l }: { l: Locale }) {
  return <p className="mb-6 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground">{translator(l)('lang.fallback')}</p>
}

export const label = (l: Locale, prefix: string, value: unknown) => (value ? translator(l)(`${prefix}.${value}` as Key) ?? String(value) : undefined)

export const recordHref = (l: Locale, type: RecordType, id: number) => href(l, `/archive/${type}/${id}`)

export const isVideo = (m: Doc) => Boolean(m.mimeType?.startsWith('video/') || m.youtube_url)

const SINGULAR = { reports: 'type.report', datasets: 'type.dataset', publications: 'type.publication', media: 'type.photo', events: 'type.event' } as const
export const typeLabel = (l: Locale, type: RecordType, doc: Doc) => translator(l)(type === 'media' && isVideo(doc) ? 'type.video' : SINGULAR[type])

// Title shown for a record: media has no title field, so its caption (or alt text) stands in.
export const titleOf = (type: RecordType, doc: Doc) => (type === 'media' ? (pick(doc.caption, 'en') ? doc.caption : doc.alt) : doc.title)

export function whenOf(l: Locale, type: RecordType, doc: Doc) {
  if (type === 'events') return doc.date ? formatDate(l, doc.date) : undefined
  if (type === 'media') return doc.taken_at ? formatDate(l, doc.taken_at) : undefined
  return doc.year ? formatYear(l, doc.year) : undefined
}

export function coordinates(l: Locale, lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return undefined
  const t = translator(l)
  const f = (n: number) => formatNumber(l, Math.abs(n), { maximumFractionDigits: 3 })
  return `${f(lat)}° ${t(lat < 0 ? 'geo.s' : 'geo.n')}, ${f(lng)}° ${t(lng < 0 ? 'geo.w' : 'geo.e')}`
}

// Resized copies from upload time (plan §6.3); the original only if no copy exists.
export function MediaImage({ m, l, sizes, className, eager }: { m: Doc; l: Locale; sizes: string; className?: string; eager?: boolean }) {
  if (!m?.url || !m.mimeType?.startsWith('image/')) return null
  const alt = pick(m.alt, l)
  const copies = [m.sizes?.thumbnail, m.sizes?.large].filter((s) => s?.url && s.width)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- files are served from R2, already resized (plan §6.3)
    <img
      src={copies.at(-1)?.url ?? m.url}
      srcSet={copies.length ? copies.map((s) => `${s.url} ${s.width}w`).join(', ') : undefined}
      sizes={sizes}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      alt={alt ? alt.value : ''}
      lang={alt && alt.lang !== l ? alt.lang : undefined}
      loading={eager ? undefined : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v != null && v !== '' && v !== false)
  if (!shown.length) return null
  return (
    <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-2 text-sm">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ExternalLink({ url, children }: { url: unknown; children?: ReactNode }) {
  const u = safeUrl(url)
  if (!u) return null
  return (
    <a href={u} className="underline underline-offset-4 hover:no-underline" rel="noopener noreferrer">
      {children ?? u}
    </a>
  )
}

// Source, license and credit: shown on every record (plan §9, §19).
export function provenanceFacts(l: Locale, doc: Doc): [string, ReactNode][] {
  const t = translator(l)
  return [
    [t('field.source'), safeUrl(doc.source_url) && <ExternalLink url={doc.source_url} />],
    [t('field.license'), en(l, doc.license)],
    [t('field.credit'), en(l, doc.credit)],
  ]
}

export function RecordCard({ type, doc, l }: { type: RecordType; doc: Doc; l: Locale }) {
  const excerpt = pick(type === 'reports' ? doc.summary : type === 'events' ? doc.description : type === 'media' ? null : doc.abstract, l)
  return (
    <article className="relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40">
      {type === 'media' && (
        <MediaImage m={doc} l={l} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw" className="-mx-4 -mt-4 mb-1 aspect-[3/2] w-[calc(100%+2rem)] max-w-none object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{typeLabel(l, type, doc)}</Badge>
        {whenOf(l, type, doc)}
      </div>
      <h3 className="line-clamp-3 font-medium leading-snug">
        <a href={recordHref(l, type, doc.id)} className="after:absolute after:inset-0 focus-visible:outline-none">
          <L v={titleOf(type, doc)} l={l} />
        </a>
      </h3>
      {excerpt && (
        <p className="line-clamp-3 text-sm text-muted-foreground" lang={excerpt.lang === l ? undefined : excerpt.lang}>
          {stripMarkers(excerpt.value)}
        </p>
      )}
    </article>
  )
}

export function RecordGrid({ type, docs, l }: { type: RecordType; docs: Doc[]; l: Locale }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => (
        <li key={d.id} className="grid">
          <RecordCard type={type} doc={d} l={l} />
        </li>
      ))}
    </ul>
  )
}

// Every record type linked to an expedition or station, one section each; "view all" opens the filtered archive.
export function LinkedRecords({ groups, l, archiveQuery, empty }: { groups: { type: RecordType; docs: Doc[]; total: number }[]; l: Locale; archiveQuery: string; empty: string }) {
  const t = translator(l)
  const shown = groups.filter((g) => g.docs.length)
  if (!shown.length) return <p className="text-muted-foreground">{empty}</p>
  return (
    <div className="flex flex-col gap-8">
      {shown.map(({ type, docs, total }) => (
        <section key={type} aria-labelledby={`linked-${type}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={`linked-${type}`} className="text-lg font-semibold">
              {t(`type.${type}`)} <span className="text-muted-foreground">({formatNumber(l, total)})</span>
            </h3>
            {total > docs.length && (
              <a href={href(l, `/archive?type=${type}${archiveQuery ? `&${archiveQuery}` : ''}`)} className="text-sm underline underline-offset-4">
                {t('action.viewAllCount', { count: formatNumber(l, total) })}
              </a>
            )}
          </div>
          <RecordGrid type={type} docs={docs} l={l} />
        </section>
      ))}
    </div>
  )
}

// A summary with [c:<chunk id>] markers (plan §7, §10.3, §14): each becomes a numbered link to the cited page of
// the record's own PDF, never raw "[c:123]" text. Markers for chunks of another record are dropped.
export async function CitedText({ v, l, collection, doc }: { v: unknown; l: Locale; collection: string; doc: Doc }) {
  const p = pick(v, l)
  if (!p) return null
  const t = translator(l)
  const pages = await citedPages(collection, doc.id, [...new Set(citedIds(p.value))])
  const numbers = new Map<number, number>()
  const cite = (id: number, key: string) => {
    if (!pages.has(id) || !doc.url) return null
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1)
    const n = numbers.get(id)!
    const page = pages.get(id)
    return (
      <sup key={key}>
        <a
          href={page ? `${doc.url}#page=${page}` : doc.url}
          lang={l}
          aria-label={page ? t('summary.citeLabel', { n, page }) : t('summary.citeLabelNoPage', { n })}
          className="px-0.5 font-medium text-primary underline-offset-2 hover:underline"
        >
          [{formatNumber(l, n)}]
        </a>
      </sup>
    )
  }
  const paragraphs = p.value.split(/\n\s*\n/).map((para, i) => (
    // split with a capture group: odd entries are chunk ids
    <p key={i}>{para.split(/\s*\[c:(\d+)\]/).map((part, j) => (j % 2 ? cite(Number(part), `${i}-${j}`) : part))}</p>
  ))
  return (
    <div lang={p.lang === l ? undefined : p.lang} className="flex flex-col gap-3">
      {paragraphs}
      {numbers.size > 0 && (
        <div className="text-sm" lang={l}>
          <h3 className="font-medium">{t('summary.sources')}</h3>
          <ol className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {[...numbers].map(([id, n]) => (
              <li key={id}>
                <a href={pages.get(id) ? `${doc.url}#page=${pages.get(id)}` : doc.url} className="underline underline-offset-4">
                  [{formatNumber(l, n)}] {pages.get(id) ? t('summary.page', { page: formatNumber(l, pages.get(id)!) }) : t('field.file')}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

const youtubeId = (url: string) => url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)?.[1]

// Full-size photo, video file or YouTube embed for a media record's own page.
export function MediaPlayer({ m, l }: { m: Doc; l: Locale }) {
  const alt = pick(m.alt, l)
  const yt = typeof m.youtube_url === 'string' ? youtubeId(m.youtube_url) : undefined
  if (yt)
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-muted">
        <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={alt?.value} lang={alt?.lang} allowFullScreen loading="lazy" className="size-full" />
      </div>
    )
  if (m.url && m.mimeType?.startsWith('video/'))
    return <video controls preload="metadata" src={m.url} aria-label={alt?.value} lang={alt?.lang} className="w-full rounded-xl bg-black" />
  return <MediaImage m={m} l={l} sizes="(min-width: 1024px) 48rem, 100vw" eager className="h-auto w-full rounded-xl" />
}

export const season = (doc: Doc, l: Locale) => (doc.season_start ? `${formatYear(l, doc.season_start)}${doc.season_end && doc.season_end !== doc.season_start ? `–${formatYear(l, doc.season_end)}` : ''}` : '')

export function ExpeditionList({ docs, l }: { docs: Doc[]; l: Locale }) {
  return (
    <ol className="flex flex-col gap-3">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-col">
          <a href={href(l, `/expeditions/${d.id}`)} className="font-medium underline-offset-4 hover:underline">
            <L v={d.title} l={l} />
          </a>
          <span className="text-sm text-muted-foreground">
            {[season(d, l), label(l, 'region', d.region)].filter(Boolean).join(' · ')}
            {d.leader && (
              <>
                {' · '}
                <L v={d.leader} l={l} />
              </>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function StationCard({ doc, l, compact }: { doc: Doc; l: Locale; compact?: boolean }) {
  const t = translator(l)
  const cover = rel(doc.cover)
  return (
    <article className="relative flex gap-4 overflow-hidden rounded-xl border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40">
      {!compact && cover && (
        <MediaImage m={cover} l={l} sizes="8rem" className="size-24 shrink-0 rounded-lg object-cover sm:size-32" />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-semibold">
          <a href={href(l, `/stations/${doc.id}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            <L v={doc.name} l={l} />
          </a>
        </h3>
        <p className="text-sm text-muted-foreground">
          {[label(l, 'region', doc.region), label(l, 'status', doc.operational_status), doc.established && t('station.establishedYear', { year: formatYear(l, doc.established) })]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {!compact && <L v={doc.description} l={l} as="p" className="line-clamp-3 text-sm" />}
      </div>
    </article>
  )
}

export const h1 = 'text-3xl font-semibold tracking-tight text-balance sm:text-4xl'
export const h2 = 'mb-4 text-xl font-semibold tracking-tight'
