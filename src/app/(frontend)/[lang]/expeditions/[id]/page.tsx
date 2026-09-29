import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { href, translator } from '@/i18n'

import { findOne, linkedRecords, pageLocale, pick, rel, rels, text, type Params } from '../../../_lib/data'
import { BackLink, en, expeditionNumber, FallbackNote, Facts, fallsBack, h1, h2, L, label, LinkedRecords, MediaImage, Meta, PageHead, Paragraphs, provenanceFacts, season } from '../../../_lib/ui'

type P = Params<{ id: string }>

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const l = await pageLocale(params)
  const doc = await findOne('expeditions', (await params).id)
  return doc ? { title: text(doc.title, l) } : {}
}

export default async function Expedition({ params }: { params: P }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const doc = await findOne('expeditions', (await params).id)
  if (!doc) notFound()
  const groups = await linkedRecords({ expedition: { equals: doc.id } })
  const stations = rels(doc.stations)
  const cover = rel(doc.cover)
  const highlights = pick<{ text: string }[]>(doc.highlights, l)

  return (
    <article>
      <PageHead
        back={<BackLink to={href(l, '/expeditions')}>{t('nav.expeditions')}</BackLink>}
        mark={expeditionNumber(l, doc) && <span aria-hidden="true" className="hidden shrink-0 font-display font-figures text-7xl leading-none text-slate sm:block">{expeditionNumber(l, doc)}</span>}
        title={
          <>
            <L v={doc.title} l={l} as="h1" className={h1} />
            <Meta className="mt-4 text-base" items={[season(doc, l) && <span className="font-figures">{season(doc, l)}</span>, label(l, 'region', doc.region), doc.leader && <>{t('field.leader')} {en(l, doc.leader)}</>]} />
          </>
        }
      />
      {fallsBack(l, doc.title, doc.summary, doc.highlights) && <FallbackNote l={l} />}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr]">
        <div className="flex min-w-0 max-w-[65ch] flex-col gap-6">
          {cover && <MediaImage m={cover} l={l} sizes="(min-width: 1024px) 40rem, 100vw" eager className="h-auto w-full rounded-xl" />}
          <Paragraphs v={doc.summary} l={l} className="flex flex-col gap-3 text-lg" />
          {highlights && (
            <section aria-labelledby="highlights">
              <h2 id="highlights" className={h2}>{t('expedition.highlights')}</h2>
              <ul className="list-disc space-y-2 pl-5 text-lg" lang={highlights.lang === l ? undefined : highlights.lang}>
                {highlights.value.map((h, i) => (
                  <li key={i}>{h.text}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="self-start rounded-xl bg-ice p-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Facts
            items={[
              [t('field.season'), season(doc, l)],
              [t('field.leader'), en(l, doc.leader)],
              [t('field.region'), label(l, 'region', doc.region)],
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
              ...provenanceFacts(l, doc),
            ]}
          />
          <a href={href(l, `/compare?type=expeditions&a=${doc.id}`)} className="mt-6 inline-flex min-h-11 items-center font-medium underline">{t('compare.expedition')}</a>
        </aside>

        {/* Left column beside the facts on wide screens (a short summary no longer leaves it empty); after them on phones. */}
        <section aria-labelledby="records" className="min-w-0 lg:col-start-1">
          <h2 id="records" className={h2}>{t('expedition.records')}</h2>
          <LinkedRecords groups={groups} l={l} archiveQuery={`expedition=${doc.id}`} empty={t('expedition.none')} />
        </section>
      </div>
    </article>
  )
}
