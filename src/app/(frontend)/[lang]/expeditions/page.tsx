import type { Metadata } from 'next'

import { formatNumber, formatYear, translator } from '@/i18n'

import { find, pageLocale, REGIONS, type Doc, type Params } from '../../_lib/data'
import { ExpeditionList, h2Base, label, PageHead } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('expeditions.title') }
}

// Timeline by region (plan §5), oldest first, grouped by decade; expeditions without a season go last.
export default async function Expeditions({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const all = (await find('expeditions', { sort: 'season_start', limit: 0 })).docs as Doc[]
  const regions = REGIONS.map((region) => {
    const docs = all.filter((d) => d.region === region)
    const decades = new Map<string, Doc[]>()
    for (const d of docs) {
      const key = d.season_start ? t('expeditions.decade', { decade: formatYear(l, Math.floor(d.season_start / 10) * 10) }) : t('expeditions.noSeason')
      decades.set(key, [...(decades.get(key) ?? []), d])
    }
    return { region, count: docs.length, decades: [...decades] }
  }).filter((r) => r.count)

  return (
    <>
      <PageHead title={t('expeditions.title')} intro={t('expeditions.intro')}>
        {regions.length > 1 && (
          <nav aria-label={t('expeditions.jump')} className="mt-8">
            <ul className="flex flex-wrap gap-3">
              {regions.map(({ region, count }) => (
                <li key={region}>
                  <a href={`#${region}`} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control bg-snow px-4 font-medium no-underline hover:bg-ice">
                    {label(l, 'region', region)} <span className="font-figures text-slate">{formatNumber(l, count)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageHead>
      {regions.map(({ region, count, decades }) => (
        <section key={region} id={region} aria-labelledby={`${region}-h`} className="mb-16 scroll-mt-6">
          <h2 id={`${region}-h`} className={h2Base}>
            {label(l, 'region', region)} <span className="font-figures text-slate">{formatNumber(l, count)}</span>
          </h2>
          {decades.map(([decade, docs]) => (
            <div key={decade} className="mt-10 grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <h3 className="self-start font-display text-2xl text-slate sm:sticky sm:top-6 sm:text-4xl">{decade}</h3>
              <ExpeditionList docs={docs} l={l} />
            </div>
          ))}
        </section>
      ))}
    </>
  )
}
