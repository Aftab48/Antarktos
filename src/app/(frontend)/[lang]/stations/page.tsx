import type { Metadata } from 'next'

import { translator } from '@/i18n'

import { find, pageLocale, type Doc, type Params } from '../../_lib/data'
import { PageHead, StationCard } from '../../_lib/ui'
import { stationPoints } from '../../_lib/station-map'
import { StationMap } from './StationMap'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('stations.title') }
}

export default async function Stations({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const stations = (await find('stations', { sort: 'established', depth: 1, limit: 0 })).docs as Doc[]
  return (
    <>
      <PageHead title={t('stations.title')} intro={t('stations.intro')} />
      <StationMap points={stationPoints(stations, l)} l={l} />
      <ul id="station-list" tabIndex={-1} className="mt-12 grid scroll-mt-8 gap-6 md:grid-cols-2">
        {stations.map((s) => (
          <li key={s.id} className="grid">
            <StationCard doc={s} l={l} />
          </li>
        ))}
      </ul>
    </>
  )
}
