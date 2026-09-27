import type { Metadata } from 'next'

import { formatNumber, translator } from '@/i18n'

import { find, pageLocale, REGIONS, type Doc, type Params } from '../../_lib/data'
import { ExpeditionList, h1, label } from '../../_lib/ui'

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
      const key = d.season_start ? t('expeditions.decade', { decade: Math.floor(d.season_start / 10) * 10 }) : t('expeditions.noSeason')
      decades.set(key, [...(decades.get(key) ?? []), d])
    }
    return { region, count: docs.length, decades: [...decades] }
  }).filter((r) => r.count)

  return (
    <>
      <h1 className={h1}>{t('expeditions.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('expeditions.intro')}</p>
      {regions.length > 1 && (
        <nav aria-label={t('expeditions.jump')} className="mt-4">
          <ul className="flex flex-wrap gap-2 text-sm">
            {regions.map(({ region }) => (
              <li key={region}>
                <a href={`#${region}`} className="inline-block rounded-md border px-3 py-1 hover:bg-muted">
                  {label(l, 'region', region)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {regions.map(({ region, count, decades }) => (
        <section key={region} id={region} aria-labelledby={`${region}-h`} className="mt-10">
          <h2 id={`${region}-h`} className="text-2xl font-semibold">
            {label(l, 'region', region)} <span className="text-muted-foreground">({formatNumber(l, count)})</span>
          </h2>
          {decades.map(([decade, docs]) => (
            <div key={decade} className="mt-6 grid gap-2 sm:grid-cols-[8rem_1fr]">
              <h3 className="font-semibold text-primary">{decade}</h3>
              <div className="border-l-2 border-primary/30 pl-5">
                <ExpeditionList docs={docs} l={l} />
              </div>
            </div>
          ))}
        </section>
      ))}
    </>
  )
}
