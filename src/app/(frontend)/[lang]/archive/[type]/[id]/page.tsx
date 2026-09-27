import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatNumber, formatYear, href, translator, type Locale } from '@/i18n'

import { findOne, isRecordType, pageLocale, pick, rel, rels, safeUrl, text, type Doc, type Params, type RecordType } from '../../../../_lib/data'
import {
  CitedText,
  coordinates,
  en,
  ExternalLink,
  FallbackNote,
  Facts,
  fallsBack,
  h1,
  h2,
  L,
  label,
  MediaImage,
  MediaPlayer,
  Paragraphs,
  provenanceFacts,
  recordHref,
  titleOf,
  typeLabel,
} from '../../../../_lib/ui'

type P = Params<{ type: string; id: string }>

async function load(params: P) {
  const { type, id } = await params
  if (!isRecordType(type)) return null
  const doc = await findOne(type, id)
  return doc ? { type, doc } : null
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const l = await pageLocale(params)
  const r = await load(params)
  return r ? { title: text(titleOf(r.type, r.doc), l).slice(0, 120) } : {}
}

const list = (v: unknown) => (Array.isArray(v) && v.length ? v.join(', ') : undefined)
const megabytes = (l: Locale, bytes?: number) =>
  bytes ? formatNumber(l, bytes / 1e6, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }) : undefined
const doiUrl = (doi?: string) => (doi ? (safeUrl(doi) ?? `https://doi.org/${doi.replace(/^doi:\s*/i, '')}`) : undefined)

function ActionLink({ url, children }: { url: unknown; children: ReactNode }) {
  const u = safeUrl(url)
  return u ? (
    <Button asChild size="lg">
      <a href={u}>{children}</a>
    </Button>
  ) : null
}

// Record detail for every archive type (plan §15): report, dataset, publication, media, event.
export default async function RecordPage({ params }: { params: P }) {
  const l = await pageLocale(params)
  const r = await load(params)
  if (!r) notFound()
  const { type, doc } = r
  const t = translator(l)
  const expedition = rel(doc.expedition)
  const stations = rels(doc.stations)
  const linked: [string, ReactNode][] = [
    [t('field.region'), label(l, 'region', doc.region)],
    [
      t('field.expedition'),
      expedition && (
        <a href={href(l, `/expeditions/${expedition.id}`)} className="underline underline-offset-4">
          <L v={expedition.title} l={l} />
        </a>
      ),
    ],
    [
      t('field.stations'),
      stations.length > 0 && (
        <ul>
          {stations.map((s) => (
            <li key={s.id}>
              <a href={href(l, `/stations/${s.id}`)} className="underline underline-offset-4">
                <L v={s.name} l={l} />
              </a>
            </li>
          ))}
        </ul>
      ),
    ],
  ]
  const { body, facts, actions } = details(type, doc, l)
  const mainText = { reports: doc.summary, datasets: doc.abstract, publications: doc.abstract, media: doc.caption, events: doc.description }[type]

  return (
    <article>
      <a href={href(l, `/archive?type=${type}`)} className="text-sm underline underline-offset-4">
        {t('nav.archive')} · {t(`type.${type}`)}
      </a>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{typeLabel(l, type, doc)}</Badge>
        {doc.region && <Badge variant="secondary">{label(l, 'region', doc.region)}</Badge>}
      </div>
      <L v={titleOf(type, doc)} l={l} as="h1" className={`${type === 'media' ? 'text-2xl font-semibold tracking-tight sm:text-3xl' : h1} mt-3`} />
      <div className="mt-6">{fallsBack(l, titleOf(type, doc), mainText) && <FallbackNote l={l} />}</div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 max-w-prose flex-col gap-6">
          {body}
          {actions.some(Boolean) && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
        <aside>
          <Facts items={[...facts, ...linked, ...provenanceFacts(l, doc)]} />
        </aside>
      </div>
    </article>
  )
}

function details(type: RecordType, doc: Doc, l: Locale): { body: ReactNode; facts: [string, ReactNode][]; actions: ReactNode[] } {
  const t = translator(l)
  const aiNote = (key: 'summary.aiNote' | 'media.aiNote') => doc.ai_generated && <p className="text-sm text-muted-foreground">{t(key)}</p>
  switch (type) {
    case 'reports':
      return {
        body: pick(doc.summary, l) && (
          <section aria-labelledby="summary" className="flex flex-col gap-3">
            <h2 id="summary" className={h2}>{t('summary.heading')}</h2>
            <CitedText v={doc.summary} l={l} collection="reports" doc={doc} />
            {aiNote('summary.aiNote')}
          </section>
        ),
        facts: [
          [t('field.type'), label(l, 'reportType', doc.report_type)],
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.pages'), doc.page_count && formatNumber(l, doc.page_count)],
          [t('field.file'), megabytes(l, doc.filesize)],
          [t('field.keywords'), en(l, list(doc.keywords))],
        ],
        actions: [<ActionLink key="pdf" url={doc.url}>{t('action.openPdf')}</ActionLink>],
      }
    case 'datasets':
      return {
        body: (
          <>
            <Paragraphs v={doc.abstract} l={l} className="flex flex-col gap-3 text-lg" />
            {doc.parameters?.length > 0 && (
              <section aria-labelledby="parameters">
                <h2 id="parameters" className={h2}>{t('field.parameters')}</h2>
                <ul className="list-disc pl-5" lang={l === 'en' ? undefined : 'en'}>
                  {doc.parameters.map((p: string) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ),
        facts: [
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.temporal'), doc.temporal_from && [doc.temporal_from, doc.temporal_to].filter(Boolean).map((d) => formatDate(l, d)).join(' – ')],
          [t('field.bbox'), doc.bbox?.south != null && `${coordinates(l, doc.bbox.south, doc.bbox.west)} – ${coordinates(l, doc.bbox.north, doc.bbox.east)}`],
          [t('field.format'), en(l, doc.format)],
          [t('field.doi'), doc.doi && <ExternalLink url={doiUrl(doc.doi)}>{doc.doi}</ExternalLink>],
          [t('field.contact'), en(l, doc.contact)],
          [t('field.keywords'), en(l, list(doc.keywords))],
          [t('field.file'), megabytes(l, doc.filesize)],
        ],
        actions: [
          doc.filename && <ActionLink key="file" url={doc.url}>{t('action.download')}</ActionLink>,
          <ActionLink key="portal" url={doc.external_url}>{t('action.dataPortal')}</ActionLink>,
        ],
      }
    case 'publications':
      return {
        body: <Paragraphs v={doc.abstract} l={l} className="flex flex-col gap-3 text-lg" />,
        facts: [
          [t('field.authors'), en(l, list(doc.authors))],
          [t('field.venue'), en(l, doc.venue)],
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.doi'), doc.doi && <ExternalLink url={doiUrl(doc.doi)}>{doc.doi}</ExternalLink>],
        ],
        actions: [
          <ActionLink key="link" url={doc.link}>{t('action.readPaper')}</ActionLink>,
          doc.filename && <ActionLink key="pdf" url={doc.url}>{t('action.openPdf')}</ActionLink>,
        ],
      }
    case 'media':
      return {
        body: (
          <>
            <MediaPlayer m={doc} l={l} />
            <Paragraphs v={doc.caption} l={l} className="flex flex-col gap-3" />
            {aiNote('media.aiNote')}
          </>
        ),
        facts: [
          [t('field.takenAt'), doc.taken_at && formatDate(l, doc.taken_at)],
          [t('field.coordinates'), coordinates(l, doc.lat, doc.lng)],
          [t('field.tags'), en(l, list(doc.tags))],
        ],
        actions: [],
      }
    case 'events': {
      const media = rels(doc.media)
      return {
        body: (
          <>
            <Paragraphs v={doc.description} l={l} className="flex flex-col gap-3 text-lg" />
            {media.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((m) => (
                  <li key={m.id}>
                    <a href={recordHref(l, 'media', m.id)} className="block overflow-hidden rounded-lg">
                      <MediaImage m={m} l={l} sizes="(min-width: 640px) 14rem, 45vw" className="aspect-square w-full object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        ),
        facts: [
          [t('field.date'), doc.date && formatDate(l, doc.date)],
          [t('field.type'), label(l, 'eventType', doc.event_type)],
          [t('field.location'), en(l, doc.location)],
        ],
        actions: [],
      }
    }
  }
}
