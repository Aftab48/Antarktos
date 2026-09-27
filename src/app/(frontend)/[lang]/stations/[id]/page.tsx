import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { href, translator } from '@/i18n'

import { find, findOne, linkedRecords, pageLocale, rel, text, type Params } from '../../../_lib/data'
import { coordinates, ExpeditionList, FallbackNote, Facts, fallsBack, h1, h2, L, label, LinkedRecords, MediaImage, Paragraphs, provenanceFacts } from '../../../_lib/ui'

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
      <a href={href(l, '/stations')} className="text-sm underline underline-offset-4">
        {t('nav.stations')}
      </a>
      <L v={doc.name} l={l} as="h1" className={`${h1} mt-2`} />
      <p className="mt-2 text-muted-foreground">{[label(l, 'region', doc.region), label(l, 'status', doc.operational_status)].filter(Boolean).join(' · ')}</p>
      <div className="mt-6">{fallsBack(l, doc.name, doc.description) && <FallbackNote l={l} />}</div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex max-w-prose flex-col gap-4">
          {cover && <MediaImage m={cover} l={l} sizes="(min-width: 1024px) 40rem, 100vw" eager className="h-auto w-full rounded-xl" />}
          <Paragraphs v={doc.description} l={l} className="flex flex-col gap-3 text-lg" />
        </div>
        <aside>
          <Facts
            items={[
              [t('field.region'), label(l, 'region', doc.region)],
              [t('field.status'), label(l, 'status', doc.operational_status)],
              [t('field.established'), doc.established],
              [t('field.closed'), doc.decommissioned],
              [t('field.coordinates'), coordinates(l, doc.lat, doc.lng)],
              ...provenanceFacts(l, doc),
            ]}
          />
        </aside>
      </div>

      {expeditions.docs.length > 0 && (
        <section aria-labelledby="expeditions" className="mt-12">
          <h2 id="expeditions" className={h2}>{t('station.expeditions')}</h2>
          <ExpeditionList docs={expeditions.docs} l={l} />
        </section>
      )}

      <section aria-labelledby="records" className="mt-12">
        <h2 id="records" className={h2}>{t('station.records')}</h2>
        <LinkedRecords groups={groups} l={l} archiveQuery={`station=${doc.id}`} empty={t('station.none')} />
      </section>
    </article>
  )
}
