import type { Metadata } from 'next'

import { translator } from '@/i18n'

import { find, pageLocale, type Doc, type Params } from '../../_lib/data'
import { h1, StationCard } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('stations.title') }
}

export default async function Stations({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const stations = (await find('stations', { sort: 'established', depth: 1, limit: 0 })).docs as Doc[]
  return (
    <>
      <h1 className={h1}>{t('stations.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('stations.intro')}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {stations.map((s) => (
          <li key={s.id} className="grid">
            <StationCard doc={s} l={l} />
          </li>
        ))}
      </ul>
    </>
  )
}
