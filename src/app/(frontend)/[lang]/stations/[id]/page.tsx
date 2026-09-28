import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { formatYear, href, translator } from '@/i18n'

import { find, findOne, linkedRecords, pageLocale, rel, text, type Params } from '../../../_lib/data'
import { BackLink, coordinates, ExpeditionList, FallbackNote, Facts, fallsBack, h1, h2, L, label, LinkedRecords, MediaImage, Meta, PageHead, Paragraphs, provenanceFacts, StatusChip } from '../../../_lib/ui'

type P = Params<{ id: string }>

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const l = await pageLocale(params)
  const doc = await findOne('stations', (await params).id)
  return doc ? { title: text(doc.name, l) } : {}
}

export default async function Station({ params }: { params: P }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const doc = await findOne('stations', (await params).id)
  if (!doc) notFound()
  const [groups, expeditions] = await Promise.all([
    linkedRecords({ stations: { in: [doc.id] } }),
    find('expeditions', { where: { stations: { in: [doc.id] } }, sort: 'season_start', limit: 0 }),
  ])
  const cover = rel(doc.cover)

  return (
    <article>
      <PageHead
        back={<BackLink to={href(l, '/stations')}>{t('nav.stations')}</BackLink>}
        title={
          <>
            <L v={doc.name} l={l} as="h1" className={h1} />
            <Meta
              className="mt-4 items-center text-base"
              items={[
                coordinates(l, doc.lat, doc.lng) && <span className="font-figures">{coordinates(l, doc.lat, doc.lng)}</span>,
                label(l, 'region', doc.region),
                <StatusChip key="s" l={l} status={doc.operational_status} />,
              ]}
            />
          </>
        }
      />
      {fallsBack(l, doc.name, doc.description) && <FallbackNote l={l} />}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 max-w-[65ch] flex-col gap-6">
          {cover && <MediaImage m={cover} l={l} sizes="(min-width: 1024px) 40rem, 100vw" eager className="h-auto w-full rounded-xl" />}
          <Paragraphs v={doc.description} l={l} className="flex flex-col gap-3 text-lg" />
        </div>
        <aside className="self-start rounded-xl bg-ice p-6 lg:sticky lg:top-6">
          <Facts
            items={[
              [t('field.region'), label(l, 'region', doc.region)],
              [t('field.status'), label(l, 'status', doc.operational_status)],
              [t('field.established'), doc.established && formatYear(l, doc.established)],
              [t('field.closed'), doc.decommissioned && formatYear(l, doc.decommissioned)],
              [t('field.coordinates'), coordinates(l, doc.lat, doc.lng)],
              ...provenanceFacts(l, doc),
            ]}
          />
        </aside>
      </div>

      {expeditions.docs.length > 0 && (
        <section aria-labelledby="expeditions" className="mt-20">
          <h2 id="expeditions" className={h2}>{t('station.expeditions')}</h2>
          <ExpeditionList docs={expeditions.docs} l={l} />
        </section>
      )}

      <section aria-labelledby="records" className="mt-20">
        <h2 id="records" className={h2}>{t('station.records')}</h2>
        <LinkedRecords groups={groups} l={l} archiveQuery={`station=${doc.id}`} empty={t('station.none')} />
      </section>
    </article>
  )
}
