import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { href, translator } from '@/i18n'

import { findOne, linkedRecords, pageLocale, pick, rel, rels, text, type Params } from '../../../_lib/data'
import { en, FallbackNote, Facts, fallsBack, h1, h2, L, label, LinkedRecords, MediaImage, Paragraphs, provenanceFacts, season } from '../../../_lib/ui'

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
      <a href={href(l, '/expeditions')} className="text-sm underline underline-offset-4">
        {t('nav.expeditions')}
      </a>
      <L v={doc.title} l={l} as="h1" className={`${h1} mt-2`} />
      <p className="mt-2 text-muted-foreground">{[label(l, 'region', doc.region), season(doc)].filter(Boolean).join(' · ')}</p>
      <div className="mt-6">{fallsBack(l, doc.title, doc.summary, doc.highlights) && <FallbackNote l={l} />}</div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex max-w-prose flex-col gap-4">
          {cover && <MediaImage m={cover} l={l} sizes="(min-width: 1024px) 40rem, 100vw" eager className="h-auto w-full rounded-xl" />}
          <Paragraphs v={doc.summary} l={l} className="flex flex-col gap-3 text-lg" />
          {highlights && (
            <section aria-labelledby="highlights">
              <h2 id="highlights" className={h2}>{t('expedition.highlights')}</h2>
              <ul className="list-disc pl-5" lang={highlights.lang === l ? undefined : highlights.lang}>
                {highlights.value.map((h, i) => (
                  <li key={i}>{h.text}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside>
          <Facts
            items={[
              [t('field.season'), season(doc)],
              [t('field.leader'), en(l, doc.leader)],
              [t('field.region'), label(l, 'region', doc.region)],
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
              ...provenanceFacts(l, doc),
            ]}
          />
        </aside>
      </div>

      <section aria-labelledby="records" className="mt-12">
        <h2 id="records" className={h2}>{t('expedition.records')}</h2>
        <LinkedRecords groups={groups} l={l} archiveQuery={`expedition=${doc.id}`} empty={t('expedition.none')} />
        {/* Step 8: approved outreach posts about this expedition go here. */}
      </section>
    </article>
  )
}
