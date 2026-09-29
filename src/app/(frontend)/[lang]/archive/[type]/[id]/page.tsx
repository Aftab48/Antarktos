import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { formatDate, formatNumber, formatYear, href, translator, type Locale } from '@/i18n'

import { findOne, isRecordType, pageLocale, pick, rel, rels, safeUrl, text, type Doc, type Params, type RecordType } from '../../../../_lib/data'
import {
  AiNote,
  BackLink,
  btn,
  btnSecondary,
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
  Meta,
  PageHead,
  MediaPlayer,
  newTab,
  NewTabNote,
  Paragraphs,
  provenanceFacts,
  recordHref,
  titleOf,
  TypeMark,
  whenOf,
} from '../../../../_lib/ui'
import { DatasetPreview } from './DatasetPreview'
import { fileSize } from './file-size'

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
const doiUrl = (doi?: string) => (doi ? (safeUrl(doi) ?? `https://doi.org/${doi.replace(/^doi:\s*/i, '')}`) : undefined)

// The first action is the primary button, the rest secondary (spec §9.11). Files and other sites: new tab.
function ActionLink({ url, l, children, primary }: { url: unknown; l: Locale; children: ReactNode; primary?: boolean }) {
  const u = safeUrl(url)
  return u ? <a href={u} className={primary ? btn : btnSecondary} {...newTab}>{children}<NewTabNote l={l} /></a> : null
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
        <a href={href(l, `/expeditions/${expedition.id}`)} className="underline">
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
              <a href={href(l, `/stations/${s.id}`)} className="underline">
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
      <PageHead
        back={<BackLink to={href(l, `/archive?type=${type}`)}>{t(`type.${type}`)}</BackLink>}
        title={
          <>
            <TypeMark l={l} type={type} doc={doc} />
            <L v={titleOf(type, doc)} l={l} as="h1" className={`${type === 'media' ? 'font-display text-3xl text-balance sm:text-4xl' : h1} mt-3`} />
            <Meta className="mt-4" items={[whenOf(l, type, doc) && <span className="font-figures">{whenOf(l, type, doc)}</span>, label(l, 'region', doc.region)]} />
          </>
        }
      />
      {fallsBack(l, titleOf(type, doc), mainText) && <FallbackNote l={l} />}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 max-w-[65ch] flex-col gap-8">
          {body}
          {actions.some(Boolean) && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
        <aside className="self-start rounded-xl bg-ice p-6 lg:sticky lg:top-6">
          <Facts items={[...facts, ...linked, ...provenanceFacts(l, doc)]} />
        </aside>
      </div>
    </article>
  )
}

function details(type: RecordType, doc: Doc, l: Locale): { body: ReactNode; facts: [string, ReactNode][]; actions: ReactNode[] } {
  const t = translator(l)
  const aiNote = (key: 'summary.aiNote' | 'media.aiNote') => doc.ai_generated && <AiNote>{t(key)}</AiNote>
  switch (type) {
    case 'reports':
      return {
        body: pick(doc.summary, l) && (
          <section aria-labelledby="summary" className="flex flex-col gap-4">
            <h2 id="summary" className={h2}>{t('summary.heading')}</h2>
            <CitedText v={doc.summary} l={l} collection="reports" doc={doc} />
            {aiNote('summary.aiNote')}
          </section>
        ),
        facts: [
          [t('field.type'), label(l, 'reportType', doc.report_type)],
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.pages'), doc.page_count && formatNumber(l, doc.page_count)],
          [t('field.file'), fileSize(l, doc.filesize)],
          [t('field.keywords'), en(l, list(doc.keywords))],
        ],
        actions: [<ActionLink key="pdf" l={l} primary url={doc.url}>{t('action.openPdf')}</ActionLink>],
      }
    case 'datasets':
      return {
        body: (
          <>
            <Paragraphs v={doc.abstract} l={l} className="flex flex-col gap-3 text-lg" />
            {doc.parameters?.length > 0 && (
              <section aria-labelledby="parameters">
                <h2 id="parameters" className={h2}>{t('field.parameters')}</h2>
                <ul className="list-disc pl-5 text-lg" lang={l === 'en' ? undefined : 'en'}>
                  {doc.parameters.map((p: string) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            )}
            <DatasetPreview doc={doc} l={l} />
          </>
        ),
        facts: [
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.temporal'), doc.temporal_from && [doc.temporal_from, doc.temporal_to].filter(Boolean).map((d) => formatDate(l, d)).join(' – ')],
          [t('field.bbox'), doc.bbox?.south != null && `${coordinates(l, doc.bbox.south, doc.bbox.west)} – ${coordinates(l, doc.bbox.north, doc.bbox.east)}`],
          [t('field.format'), en(l, doc.format)],
          [t('field.doi'), doc.doi && <ExternalLink url={doiUrl(doc.doi)} l={l}>{doc.doi}</ExternalLink>],
          [t('field.contact'), en(l, doc.contact)],
          [t('field.keywords'), en(l, list(doc.keywords))],
          [t('field.file'), fileSize(l, doc.filesize)],
        ],
        actions: [
          doc.filename && <ActionLink key="file" l={l} primary url={doc.url}>{t('action.download')}</ActionLink>,
          <ActionLink key="portal" l={l} primary={!doc.filename} url={doc.external_url}>{t('action.dataPortal')}</ActionLink>,
        ],
      }
    case 'publications':
      return {
        body: <Paragraphs v={doc.abstract} l={l} className="flex flex-col gap-3 text-lg" />,
        facts: [
          [t('field.authors'), en(l, list(doc.authors))],
          [t('field.venue'), en(l, doc.venue)],
          [t('field.year'), doc.year && formatYear(l, doc.year)],
          [t('field.doi'), doc.doi && <ExternalLink url={doiUrl(doc.doi)} l={l}>{doc.doi}</ExternalLink>],
        ],
        actions: [
          <ActionLink key="link" l={l} primary url={doc.link}>{t('action.readPaper')}</ActionLink>,
          doc.filename && <ActionLink key="pdf" l={l} primary={!safeUrl(doc.link)} url={doc.url}>{t('action.openPdf')}</ActionLink>,
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
                    <a href={recordHref(l, 'media', m.id)} className="block overflow-hidden rounded-xl">
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
