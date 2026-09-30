// Shared pieces of the public pages. All text is rendered as plain text (React escapes it), never as HTML:
// summaries and captions are AI-written (step 4b note).
import type { CSSProperties, ElementType, ReactNode } from 'react'

import { formatDate, formatNumber, formatYear, href, translator, type Key, type Locale } from '@/i18n'
import { citedIds, stripMarkers } from '@/pipeline/text'

import { h1, h3, newTab, rowFocus, sourceItem, sourceList, sourceNum } from './classes'
import { citedPages, pick, rel, safeUrl, type Doc, type RecordType } from './data'
import { latY, spreadLabels } from './meridian'
import { stationPoints } from './station-map'

export { btn, btnSecondary, h1, h2, h2Base, h3, newTab } from './classes'

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
  return <p className="mb-8 max-w-[40rem] rounded-xl border border-dashed border-control px-4 py-3 text-sm">{translator(l)('lang.fallback')}</p>
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

const latitude = (l: Locale, lat: number) =>
  `${formatNumber(l, Math.abs(lat), { maximumFractionDigits: 1 })}° ${translator(l)(lat < 0 ? 'geo.s' : 'geo.n')}`

// Resized copies from upload time (plan §6.3); the original only if no copy exists.
export function MediaImage({ m, l, sizes, className, eager }: { m: Doc; l: Locale; sizes: string; className?: string; eager?: boolean }) {
  // A missing dedicated alt must not hide an informative archive photo from assistive technology.
  const alt = pick(m?.alt, l) ?? pick(m?.caption, l)
  const yt = typeof m?.youtube_url === 'string' ? youtubeId(m.youtube_url) : undefined
  if (yt && !m.url) {
    // A link-only video has no file of its own: show YouTube's still for it (16:9, no letterbox).
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote still, fixed sizes from YouTube
      <img
        src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`}
        srcSet={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${yt}/maxresdefault.jpg 1280w`}
        sizes={sizes}
        width={320}
        height={180}
        alt={alt ? stripMarkers(alt.value) : ''}
        lang={alt && alt.lang !== l ? alt.lang : undefined}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
        className={className}
      />
    )
  }
  if (!m?.url || !m.mimeType?.startsWith('image/')) return null
  const copies = [m.sizes?.thumbnail, m.sizes?.large].filter((s) => s?.url && s.width)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- files are served from R2, already resized (plan §6.3)
    <img
      src={copies.at(-1)?.url ?? m.url}
      srcSet={copies.length ? copies.map((s) => `${s.url} ${s.width}w`).join(', ') : undefined}
      sizes={sizes}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      alt={alt ? stripMarkers(alt.value) : ''}
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
    // One column that may shrink: otherwise a long unbreakable value (a URL) widens it past the box.
    <dl className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {shown.map(([k, v]) => (
        <div key={k}>
          <dt className="text-sm text-slate">{k}</dt>
          <dd className="mt-0.5 min-w-0 break-words text-night">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

// Screen-reader note for a link that opens in a new tab.
export const NewTabNote = ({ l }: { l: Locale }) => <span className="sr-only"> ({translator(l)('link.newTab')})</span>

// A link to another site: new tab, with a small arrow that says so visually.
export function ExternalLink({ url, l, children }: { url: unknown; l: Locale; children?: ReactNode }) {
  const u = safeUrl(url)
  if (!u) return null
  return (
    <a href={u} className="underline" {...newTab}>
      {children ?? u}
      <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1 inline size-3 align-baseline" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h7v7M13 3 4 12" /></svg>
      <NewTabNote l={l} />
    </a>
  )
}

// Source, license and credit: shown on every record (plan §9, §19).
export function provenanceFacts(l: Locale, doc: Doc): [string, ReactNode][] {
  const t = translator(l)
  return [
    // The site name, not the whole URL: the link itself still goes to the page.
    [t('field.source'), safeUrl(doc.source_url) && <ExternalLink url={doc.source_url} l={l}>{en(l, new URL(doc.source_url).hostname.replace(/^www\./, ''))}</ExternalLink>],
    [t('field.license'), en(l, doc.license)],
    [t('field.credit'), en(l, doc.credit)],
  ]
}

// ---------------------------------------------------------------------------------------------------------------
// Brand, page head, meta lines, type markers (spec §6, §7, §9.6)

// The meridian in miniature: a globe outline, the pole-to-pole line, and a station pinned on it.
export function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="size-7 shrink-0">
      <circle cx="14" cy="14" r="12" fill="none" stroke="var(--line)" strokeWidth="2" />
      <path d="M14 2v24" stroke="var(--line)" strokeWidth="2" />
      <circle cx="14" cy="22" r="3.5" fill="#E4500E" />
    </svg>
  )
}

export function PageHead({ title, intro, back, mark, children }: { title: ReactNode; intro?: ReactNode; back?: ReactNode; mark?: ReactNode; children?: ReactNode }) {
  return (
    <header className="bleed bleed-ice mb-12 pt-10 pb-10 sm:pt-14">
      {back && <div className="mb-4 text-sm">{back}</div>}
      <div className="flex items-end gap-6">
        {mark}
        <div className="min-w-0">
          {typeof title === 'string' ? <h1 className={h1}>{title}</h1> : title}
          {intro && <div className="mt-4 max-w-[40rem] text-lg text-slate">{intro}</div>}
        </div>
      </div>
      {children}
    </header>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} className="inline-flex min-h-11 items-center gap-2 underline">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
      {children}
    </a>
  )
}

// Replaces "A · B · C" strings: separate spans, wrapped with a gap.
export const Meta = ({ items, className = '' }: { items: ReactNode[]; className?: string }) => (
  <p className={`flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate ${className}`}>
    {items.filter(Boolean).map((v, i) => (
      <span key={i}>{v}</span>
    ))}
  </p>
)

// Shape, not colour, tells record types apart.
const GLYPHS = {
  report: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  dataset: 'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z',
  publication: 'M12 6.5C10 5 7 4.5 3.5 4.5v14c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-14C17 4.5 14 5 12 6.5zM12 6.5v14',
  photo: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  video: 'M3 5h18v14H3zM10 9v6l5-3z',
  event: 'M4 6h16v14H4zM8 3v5M16 3v5M4 11h16',
  expedition: 'M6 21V3M6 4h12l-2.5 4L18 12H6',
  station: 'M12 3v18M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 17.5h.01',
} as const
export type GlyphKind = keyof typeof GLYPHS

export function Glyph({ kind, className = 'size-4' }: { kind: GlyphKind; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={GLYPHS[kind]} />
    </svg>
  )
}

const KIND: Record<RecordType, GlyphKind> = { reports: 'report', datasets: 'dataset', publications: 'publication', media: 'photo', events: 'event' }
export const glyphOf = (type: RecordType, doc: Doc): GlyphKind => (type === 'media' && isVideo(doc) ? 'video' : KIND[type])

export function TypeMark({ l, type, doc }: { l: Locale; type: RecordType; doc: Doc }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-night">
      <Glyph kind={glyphOf(type, doc)} />
      {typeLabel(l, type, doc)}
    </span>
  )
}

// The "reviewed by staff" check before AI notes (spec §9.11): no coloured box.
export function Reviewed() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="m5 8.2 2 2 4-4.2" />
    </svg>
  )
}

export function AiNote({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 text-sm text-slate"><Reviewed />{children}</p>
}

// A station's status in words, with a filled (active) or outlined (historical) dot: colour is never the only cue.
export function StatusChip({ l, status }: { l: Locale; status: unknown }) {
  if (!status) return null
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-night">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${status === 'historical' ? 'border-2 border-signal' : 'bg-signal'}`} />
      {label(l, 'status', status)}
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Records (spec §9.1, §9.2)

const excerptOf = (type: RecordType, doc: Doc) =>
  type === 'reports' ? doc.summary : type === 'events' ? doc.description : type === 'media' ? null : doc.abstract

// One archive record as a row. Media in a mixed list shows a thumbnail instead of the date.
export function RecordCard({ type, doc, l }: { type: RecordType; doc: Doc; l: Locale }) {
  const excerpt = pick(excerptOf(type, doc), l)
  return (
    <li className={`relative -mx-3 grid gap-2 border-t border-rule px-3 py-6 last:border-b hover:bg-ice/60 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8 ${rowFocus}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-col sm:items-start">
        <TypeMark l={l} type={type} doc={doc} />
        {type === 'media' ? (
          <MediaImage m={doc} l={l} sizes="4.5rem" className="size-18 rounded-md object-cover" />
        ) : (
          <span className="font-figures text-sm text-slate">{whenOf(l, type, doc)}</span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className={h3}>
          <a href={recordHref(l, type, doc.id)} className="underline decoration-transparent after:absolute after:inset-0 hover:decoration-night focus-visible:outline-none">
            <L v={titleOf(type, doc)} l={l} />
          </a>
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-slate" lang={excerpt.lang === l ? undefined : excerpt.lang}>
            {stripMarkers(excerpt.value)}
          </p>
        )}
      </div>
    </li>
  )
}

function PhotoItem({ doc, l }: { doc: Doc; l: Locale }) {
  const when = whenOf(l, 'media', doc)
  const image = <MediaImage m={doc} l={l} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw" className="aspect-[3/2] w-full rounded-xl object-cover" />
  return (
    <li className={`relative flex flex-col gap-3 rounded-xl ${rowFocus}`}>
      {image ?? (
        <div className="flex aspect-[3/2] w-full items-center justify-center rounded-xl bg-ice text-night">
          <Glyph kind={glyphOf('media', doc)} className="size-8" />
        </div>
      )}
      <Meta items={[<TypeMark key="t" l={l} type="media" doc={doc} />, when && <span className="font-figures">{when}</span>]} className="items-center" />
      <h3 className="line-clamp-2 font-semibold leading-snug">
        <a href={recordHref(l, 'media', doc.id)} className="underline decoration-transparent after:absolute after:inset-0 hover:decoration-night focus-visible:outline-none">
          <L v={titleOf('media', doc)} l={l} />
        </a>
      </h3>
    </li>
  )
}

export function RecordGrid({ type, docs, l }: { type: RecordType; docs: Doc[]; l: Locale }) {
  if (type === 'media')
    return (
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <PhotoItem key={d.id} doc={d} l={l} />
        ))}
      </ul>
    )
  return (
    <ol>
      {docs.map((d) => (
        <RecordCard key={d.id} type={type} doc={d} l={l} />
      ))}
    </ol>
  )
}

// An empty state always offers a next step (spec §9.10).
export function Empty({ message, action, to }: { message: ReactNode; action: ReactNode; to: string }) {
  return (
    <div className="portal-empty">
      <p>{message}</p>
      <a href={to} className="mt-2 inline-flex min-h-11 items-center font-medium underline">{action}</a>
    </div>
  )
}

// Every record type linked to an expedition or station, one section each; "view all" opens the filtered archive.
export function LinkedRecords({ groups, l, archiveQuery, empty, emptyAction }: { groups: { type: RecordType; docs: Doc[]; total: number }[]; l: Locale; archiveQuery: string; empty: string; emptyAction?: [string, string] }) {
  const t = translator(l)
  const shown = groups.filter((g) => g.docs.length)
  if (!shown.length) return <Empty message={empty} action={emptyAction?.[0] ?? t('home.browse')} to={emptyAction?.[1] ?? href(l, '/archive')} />
  return (
    <div className="flex flex-col gap-12">
      {shown.map(({ type, docs, total }) => (
        <section key={type} aria-labelledby={`linked-${type}`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h3 id={`linked-${type}`} className={h3}>
              {t(`type.${type}`)} <span className="font-figures font-normal text-slate">{formatNumber(l, total)}</span>
            </h3>
            {total > docs.length && (
              <a href={href(l, `/archive?type=${type}${archiveQuery ? `&${archiveQuery}` : ''}`)} className="inline-flex min-h-11 items-center underline">
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
          {...newTab}
          lang={l}
          aria-label={`${page ? t('summary.citeLabel', { n, page }) : t('summary.citeLabelNoPage', { n })} (${t('link.newTab')})`}
          className="citation-link"
        >
          {formatNumber(l, n)}
        </a>
      </sup>
    )
  }
  const paragraphs = p.value.split(/\n\s*\n/).map((para, i) => (
    // split with a capture group: odd entries are chunk ids
    <p key={i}>{para.split(/\s*\[c:(\d+)\]/).map((part, j) => (j % 2 ? cite(Number(part), `${i}-${j}`) : part))}</p>
  ))
  return (
    <div lang={p.lang === l ? undefined : p.lang} className="flex flex-col gap-4 text-lg leading-relaxed">
      {paragraphs}
      {numbers.size > 0 && (
        <section className="mt-6 text-base" lang={l} aria-labelledby="summary-sources">
          <h3 id="summary-sources" className={h3}>{t('summary.sources')}</h3>
          <ol className={sourceList}>
            {[...numbers].map(([id, n]) => (
              <li key={id} className={sourceItem}>
                <span aria-hidden="true" className={sourceNum}>{formatNumber(l, n)}</span>
                <a href={pages.get(id) ? `${doc.url}#page=${pages.get(id)}` : doc.url} className="font-semibold underline" {...newTab}>
                  <span className="sr-only">{t('ask.source', { n })}: </span>
                  {pages.get(id) ? t('summary.page', { page: formatNumber(l, pages.get(id)!) }) : t('field.file')}
                  <NewTabNote l={l} />
                </a>
              </li>
            ))}
          </ol>
        </section>
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
      <div className="aspect-video overflow-hidden rounded-xl bg-ice">
        <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={alt?.value} lang={alt?.lang} allowFullScreen loading="lazy" className="size-full" />
      </div>
    )
  if (m.url && m.mimeType?.startsWith('video/'))
    return <video controls preload="metadata" src={m.url} aria-label={alt?.value} lang={alt?.lang} className="w-full rounded-xl bg-night" />
  return <MediaImage m={m} l={l} sizes="(min-width: 1024px) 48rem, 100vw" eager className="h-auto w-full rounded-xl" />
}

// ---------------------------------------------------------------------------------------------------------------
// Expeditions and stations (spec §9.3, §9.4)

export const season = (doc: Doc, l: Locale) => (doc.season_start ? `${formatYear(l, doc.season_start)}${doc.season_end && doc.season_end !== doc.season_start ? `–${formatYear(l, doc.season_end)}` : ''}` : '')

// The seeded `number` field; empty stays empty (never derived from the title).
export const expeditionNumber = (l: Locale, d: Doc) =>
  d.number == null || d.number === '' ? '' : /^\d+$/.test(String(d.number)) ? formatNumber(l, Number(d.number)) : String(d.number)

// Expeditions are a real numbered sequence: the only place numbered markers appear.
export function ExpeditionList({ docs, l, showRegion }: { docs: Doc[]; l: Locale; showRegion?: boolean }) {
  const t = translator(l)
  return (
    <ol className="relative ml-2 border-l-2 border-rule pl-6 sm:pl-8">
      {docs.map((d) => (
        <li
          key={d.id}
          className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-3 before:absolute before:top-5 before:-left-[31px] before:size-3 before:rounded-full before:bg-signal before:ring-4 before:ring-snow sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4 sm:before:-left-[39px]"
        >
          <span className="text-right font-display font-figures text-2xl text-slate">{expeditionNumber(l, d)}</span>
          <div className="min-w-0">
            <a href={href(l, `/expeditions/${d.id}`)} className="text-lg font-semibold underline decoration-transparent hover:decoration-night">
              <L v={d.title} l={l} />
            </a>
            <Meta
              className="mt-1"
              items={[
                season(d, l) && <span className="font-figures">{season(d, l)}</span>,
                showRegion && label(l, 'region', d.region),
                d.leader && <>{t('field.leader')} <L v={d.leader} l={l} /></>,
              ]}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function StationCard({ doc, l, compact }: { doc: Doc; l: Locale; compact?: boolean }) {
  const t = translator(l)
  const cover = compact ? null : rel(doc.cover)
  const image = cover && <MediaImage m={cover} l={l} sizes="(min-width: 640px) 10rem, 90vw" className="aspect-[4/3] w-full rounded-lg object-cover" />
  return (
    <article className={`relative grid h-full gap-5 rounded-xl border border-rule bg-snow p-5 hover:border-control ${image ? 'sm:grid-cols-[10rem_minmax(0,1fr)]' : ''} ${rowFocus}`}>
      {image}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-3xl">
            <a href={href(l, `/stations/${doc.id}`)} className="underline decoration-transparent after:absolute after:inset-0 hover:decoration-night focus-visible:outline-none">
              <L v={doc.name} l={l} />
            </a>
          </h3>
          <StatusChip l={l} status={doc.operational_status} />
        </div>
        {coordinates(l, doc.lat, doc.lng) && <p className="font-figures text-slate">{coordinates(l, doc.lat, doc.lng)}</p>}
        <Meta items={[label(l, 'region', doc.region), doc.established && t('station.establishedYear', { year: formatYear(l, doc.established) })]} />
        {!compact && <L v={doc.description} l={l} as="p" className="mt-1 line-clamp-3" />}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// The meridian: India's stations pinned at their true latitudes, 90° N to 90° S (spec §8.1).

const H = 32 // figure height in rem (h-[32rem]); SVG y units are px, so rem × 16
const CIRCLE = 66.56

export function Meridian({ stations, l }: { stations: Doc[]; l: Locale }) {
  const t = translator(l)
  const byId = new Map(stations.map((s) => [s.id, s]))
  const points = stationPoints(stations, l).sort((a, b) => b.lat - a.lat)
  if (!points.length) return null
  const ys = points.map((p) => latY(p.lat, H))
  const labels = spreadLabels(ys, 3, H)
  const at = (rem: number): CSSProperties => ({ top: `${rem}rem` })
  const scale: [number, Key, boolean][] = [
    [CIRCLE, 'geo.arcticCircle', true],
    [0, 'geo.equator', false],
    [-CIRCLE, 'geo.antarcticCircle', true],
  ]
  const india = [latY(37.1, H), latY(8.1, H)]

  return (
    <figure className="min-w-0">
      <div className="grid h-[32rem] grid-cols-[4.5rem_1rem_2.5rem_minmax(0,1fr)] sm:grid-cols-[7.5rem_1rem_3rem_minmax(0,1fr)]">
        {/* Scale: decorative; the station list and caption carry the meaning. */}
        <div aria-hidden="true" className="relative text-right text-sm leading-tight text-slate">
          <span className="absolute right-3 top-0">90° {t('geo.n')}</span>
          {scale.map(([lat, key]) => (
            <span key={key} className="absolute right-3 -translate-y-1/2" style={at(latY(lat, H))}>{t(key)}</span>
          ))}
          <span className="absolute right-4 -translate-y-1/2 font-medium" style={at((india[0] + india[1]) / 2)}>{t('geo.india')}</span>
          <span className="absolute right-3 bottom-0">90° {t('geo.s')}</span>
        </div>

        <div aria-hidden="true" className="relative">
          <span className="meridian-line absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-line" />
          <span className="absolute w-2 bg-line/40" style={{ top: `${india[0]}rem`, height: `${india[1] - india[0]}rem`, left: 'calc(50% - 9px)' }} />
          <span className="absolute top-0 left-0 h-0.5 w-full bg-line" />
          <span className="absolute bottom-0 left-0 h-0.5 w-full bg-line" />
          {scale.map(([lat, key, dashed]) => (
            <span key={key} className={`absolute left-0 w-full -translate-y-1/2 ${dashed ? 'border-t-2 border-dashed border-line' : 'h-0.5 bg-line'}`} style={at(latY(lat, H))} />
          ))}
          {points.map((p, i) => (
            <span
              key={p.id}
              className={`meridian-dot absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.historical ? 'border-2 border-signal bg-ice' : 'bg-signal ring-2 ring-ice'}`}
              style={{ ...at(ys[i]), '--y-frac': ys[i] / H } as CSSProperties}
            />
          ))}
        </div>

        <svg aria-hidden="true" viewBox="0 0 48 512" preserveAspectRatio="none" className="h-full w-full">
          {points.map((p, i) => (
            <path key={p.id} d={`M0 ${ys[i] * 16}H12L36 ${labels[i] * 16}H48`} fill="none" stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        <ol className="relative">
          {points.map((p, i) => {
            const s = byId.get(p.id)!
            return (
              <li key={p.id} className="absolute inset-x-0 min-h-11 -translate-y-1/2 pl-2" style={at(labels[i])}>
                <p className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                  <a href={p.url} lang={p.lang === l ? undefined : p.lang} className="font-semibold underline decoration-line after:absolute after:inset-0 sm:text-lg">
                    {p.name}
                  </a>
                  <span className="font-figures text-sm text-slate">{latitude(l, p.lat)}</span>
                </p>
                <p className="flex flex-wrap gap-x-3 text-sm leading-snug text-slate">
                  <span className="hidden sm:inline">{label(l, 'region', s.region)}</span>
                  {s.established && <span>{t('station.establishedYear', { year: formatYear(l, s.established) })}</span>}
                  {s.operational_status === 'historical' && <span>{t('status.historical')}</span>}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
      <figcaption className="mt-6 text-sm text-slate">
        {t('home.meridian', { north: latitude(l, points[0].lat), south: latitude(l, points.at(-1)!.lat) })}
      </figcaption>
    </figure>
  )
}
