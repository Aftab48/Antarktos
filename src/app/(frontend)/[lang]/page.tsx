import { formatNumber, href, translator } from '@/i18n'

import { count, find, pageLocale, rel, RECORD_TYPES, type Doc, type Params } from '../_lib/data'
import { ExpeditionList, h2, L, label, RecordCard, season, StationCard } from '../_lib/ui'

export default async function Home({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const [nExpeditions, nStations, nReports, nMedia, recent, stations, reported, latest] = await Promise.all([
    count('expeditions'),
    count('stations'),
    count('reports'),
    count('media'),
    find('expeditions', { where: { season_start: { exists: true } }, sort: '-season_start', limit: 6 }),
    find('stations', { sort: 'established', depth: 1 }),
    // Featured: the expedition of the newest report, so the home page leads straight to fresh records.
    find('reports', { where: { expedition: { exists: true } }, sort: '-createdAt', limit: 1, depth: 1 }),
    // At most two of each type, so one busy type doesn't fill the list.
    Promise.all(RECORD_TYPES.map(async (type) => (await find(type, { sort: '-createdAt', limit: 2 })).docs.map((doc: Doc) => ({ type, doc })))),
  ])
  const featured = rel(reported.docs[0]?.expedition) ?? recent.docs[0]
  const newest = latest
    .flat()
    .sort((a, b) => b.doc.createdAt.localeCompare(a.doc.createdAt))
    .slice(0, 6)
  const stats = [
    [nExpeditions, t('stat.expeditions'), '/expeditions'],
    [nStations, t('stat.stations'), '/stations'],
    [nReports, t('stat.reports'), '/archive?type=reports'],
    [nMedia, t('stat.media'), '/archive?type=media'],
  ] as const

  return (
    <div className="flex flex-col gap-12">
      <section className="-mx-4 -mt-8 bg-secondary px-4 py-10 sm:rounded-b-2xl sm:px-8">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance text-primary sm:text-5xl">{t('home.title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t('home.intro')}</p>
        <a href={href(l, '/archive')} className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/85">
          {t('home.browse')}
        </a>
      </section>

      <section aria-labelledby="stats">
        <h2 id="stats" className={h2}>{t('home.stats')}</h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([n, text, path]) => (
            <li key={path}>
              <a href={href(l, path)} className="flex h-full flex-col rounded-xl border p-4 hover:bg-muted/50">
                <span className="text-3xl font-semibold text-primary">{formatNumber(l, n)}</span>
                <span className="text-sm text-muted-foreground">{text}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {featured && (
        <section aria-labelledby="featured">
          <h2 id="featured" className={h2}>{t('home.featured')}</h2>
          <article className="rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">{[label(l, 'region', featured.region), season(featured, l)].filter(Boolean).join(' · ')}</p>
            <h3 className="mt-1 text-2xl font-semibold">
              <a href={href(l, `/expeditions/${featured.id}`)} className="underline-offset-4 hover:underline">
                <L v={featured.title} l={l} />
              </a>
            </h3>
            <L v={featured.summary} l={l} as="p" className="mt-2 max-w-3xl text-muted-foreground" />
          </article>
        </section>
      )}

      {/* Step 8: the latest approved outreach posts (/news) go here (plan §5). */}

      {newest.length > 0 && (
        <section aria-labelledby="latest">
          <h2 id="latest" className={h2}>{t('home.latest')}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map(({ type, doc }) => (
              <li key={`${type}-${doc.id}`} className="grid">
                <RecordCard type={type} doc={doc} l={l} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="recent">
          <h2 id="recent" className={h2}>{t('home.recentExpeditions')}</h2>
          <ExpeditionList docs={recent.docs} l={l} />
          <a href={href(l, '/expeditions')} className="mt-4 inline-block text-sm underline underline-offset-4">{t('action.viewAll')}</a>
        </section>
        <section aria-labelledby="stations">
          <h2 id="stations" className={h2}>{t('home.stations')}</h2>
          <ul className="grid gap-3">
            {stations.docs.map((s: Doc) => (
              <li key={s.id}>
                <StationCard doc={s} l={l} compact />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
