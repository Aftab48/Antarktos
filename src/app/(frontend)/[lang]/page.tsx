import { formatNumber, formatYear, href, translator, type Key } from '@/i18n'

import { count, find, pageLocale, rel, RECORD_TYPES, type Doc, type Params } from '../_lib/data'
import { PostCard } from '../_lib/outreach'
import { btn, btnSecondary, expeditionNumber, ExpeditionList, Glyph, type GlyphKind, h2, h2Base, L, label, Meridian, Meta, RecordCard, season } from '../_lib/ui'

const GLYPH_OF: Record<(typeof RECORD_TYPES)[number], GlyphKind> = { reports: 'report', datasets: 'dataset', publications: 'publication', media: 'photo', events: 'event' }

export default async function Home({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const [nExpeditions, nStations, typeCounts, recent, earliest, stations, reported, latest, news] = await Promise.all([
    count('expeditions'),
    count('stations'),
    Promise.all(RECORD_TYPES.map((type) => count(type))),
    find('expeditions', { where: { season_start: { exists: true } }, sort: '-season_start', limit: 6 }),
    find('expeditions', { where: { season_start: { exists: true } }, sort: 'season_start', limit: 1 }),
    find('stations', { sort: 'established', limit: 0 }),
    // Featured: the expedition of the newest report, so the home page leads straight to fresh records.
    find('reports', { where: { expedition: { exists: true } }, sort: '-createdAt', limit: 1, depth: 1 }),
    // At most two of each type, so one busy type doesn't fill the list.
    Promise.all(RECORD_TYPES.map(async (type) => (await find(type, { sort: '-createdAt', limit: 2 })).docs.map((doc: Doc) => ({ type, doc })))),
    // Same filter as /news.
    find('outreach-posts', { where: { and: [{ language: { equals: l } }, { platform: { not_equals: 'student_explainer' } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, sort: '-createdAt', limit: 3, depth: 1 }),
  ])
  const featured = rel(reported.docs[0]?.expedition) ?? recent.docs[0]
  const others = recent.docs.filter((d: Doc) => d.id !== featured?.id).slice(0, 5)
  const newest = latest
    .flat()
    .sort((a, b) => b.doc.createdAt.localeCompare(a.doc.createdAt))
    .slice(0, 6)
  const since = earliest.docs[0]?.season_start
  // Rows with nothing in them are left out, so the catalogue never shows a zero.
  const catalogue = (
    [
      [nExpeditions, 'stat.expeditions', '/expeditions', 'expedition'],
      [nStations, 'stat.stations', '/stations', 'station'],
      ...RECORD_TYPES.map((type, i) => [typeCounts[i], `type.${type}`, `/archive?type=${type}`, GLYPH_OF[type]] as const),
    ] as [number, Key, string, GlyphKind][]
  ).filter(([n]) => n > 0)
  const hi = l === 'hi'

  return (
    <>
      <section aria-labelledby="home-title" className="bleed bleed-ice py-12 sm:py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div className="lg:pt-6">
            <h1 id="home-title" className={`font-display text-balance ${hi ? 'max-w-[14ch] text-4xl sm:text-6xl' : 'max-w-[12ch] text-5xl sm:text-7xl'}`}>
              {t('home.title')}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg text-slate">{t('home.intro')}</p>
            <form method="get" action={href(l, '/archive')} role="search" className="mt-10 max-w-[34rem]">
              <label htmlFor="home-q" className="text-sm font-medium">{t('archive.search')}</label>
              <div className="mt-2 flex">
                <input id="home-q" name="q" type="search" maxLength={300} aria-describedby="home-q-hint" className="h-14 min-w-0 flex-1 rounded-l-md border border-r-0 border-control bg-snow px-4 text-lg" />
                <button type="submit" className="inline-flex h-14 shrink-0 items-center rounded-r-md bg-night px-5 font-semibold text-snow hover:bg-deep">{t('archive.searchSubmit')}</button>
              </div>
              <p id="home-q-hint" className="mt-2 text-sm text-slate">{t('archive.searchHint')}</p>
            </form>
            <a href={href(l, '/ask')} className="mt-6 inline-flex min-h-11 items-center font-medium underline decoration-line">
              {t('ask.submit')}
            </a>
          </div>
          <Meridian stations={stations.docs} l={l} />
        </div>
      </section>

      {catalogue.length > 0 && (
        <section aria-labelledby="catalogue" className="grid gap-8 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12">
          <div>
            <h2 id="catalogue" className={h2}>{t('home.catalogue')}</h2>
            <p className="max-w-[24rem] text-lg text-slate">{t('home.catalogueIntro')}</p>
          </div>
          <ul className="-mx-3 border-t border-rule">
            {catalogue.map(([n, key, path, glyph]) => (
              <li key={path}>
                <a href={href(l, path)} className="flex min-h-16 items-center gap-4 border-b border-rule px-3 py-4 text-[1.3125rem] font-semibold no-underline hover:bg-ice">
                  <Glyph kind={glyph} className="size-5" />
                  <span className="flex-1">{t(key)}</span>
                  <span className="font-display font-figures text-4xl">{formatNumber(l, n)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured && (
        <section aria-labelledby="expeditions" className="border-t border-rule py-16 sm:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 id="expeditions" className={`${h2Base} mb-2`}>{t('nav.expeditions')}</h2>
              {since && <p className="text-lg text-slate">{t('home.expeditionsSince', { count: formatNumber(l, nExpeditions), year: formatYear(l, since) })}</p>}
            </div>
            <a href={href(l, '/expeditions')} className="inline-flex min-h-11 items-center font-medium underline">
              {t('action.viewAllCount', { count: formatNumber(l, nExpeditions) })}
            </a>
          </div>
          <div className="grid gap-12 lg:grid-cols-2">
            <article className="flex flex-col self-start rounded-xl bg-ice p-6 sm:p-8">
              {expeditionNumber(l, featured) && <p aria-hidden="true" className="font-display font-figures text-7xl text-slate">{expeditionNumber(l, featured)}</p>}
              <h3 className="mt-4 text-2xl font-semibold leading-snug">
                <a href={href(l, `/expeditions/${featured.id}`)} className="underline decoration-transparent hover:decoration-night">
                  <L v={featured.title} l={l} />
                </a>
              </h3>
              <Meta className="mt-3" items={[season(featured, l) && <span className="font-figures">{season(featured, l)}</span>, label(l, 'region', featured.region), featured.leader && <>{t('field.leader')} <L v={featured.leader} l={l} /></>]} />
              <L v={featured.summary} l={l} as="p" className="mt-4 line-clamp-3 text-lg" />
            </article>
            {others.length > 0 && <ExpeditionList docs={others} l={l} showRegion />}
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section aria-labelledby="latest" className="border-t border-rule py-16 sm:py-24">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h2 id="latest" className={h2Base}>{t('home.latest')}</h2>
            <a href={href(l, '/archive')} className="inline-flex min-h-11 items-center font-medium underline">{t('home.browse')}</a>
          </div>
          <ol>
            {newest.map(({ type, doc }) => (
              <RecordCard key={`${type}-${doc.id}`} type={type} doc={doc} l={l} />
            ))}
          </ol>
        </section>
      )}

      {news.docs.length > 0 && (
        <section aria-labelledby="news" className="border-t border-rule py-16 sm:py-24">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h2 id="news" className={h2Base}>{t('nav.news')}</h2>
            <a href={href(l, '/news')} className="inline-flex min-h-11 items-center font-medium underline">{t('action.viewAll')}</a>
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-3">
            {news.docs.map((post: Doc) => (
              <li key={post.id}>
                <PostCard post={post} l={l} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bleed bleed-ice -mb-20 grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-8">
        <section aria-labelledby="learn">
          <h2 id="learn" className={`${h2Base} mb-4`}>{t('learn.title')}</h2>
          <p className="max-w-[34rem] text-lg text-slate">{t('learn.intro')}</p>
          <a href={href(l, '/learn')} className={`${btn} mt-6`}>{t('home.learnStart')}</a>
        </section>
        <section aria-labelledby="ask">
          <h2 id="ask" className={`${h2Base} mb-4`}>{t('ask.title')}</h2>
          <p className="max-w-[34rem] text-lg text-slate">{t('ask.intro')}</p>
          <a href={href(l, '/ask')} className={`${btnSecondary} mt-6`}>{t('ask.submit')}</a>
        </section>
      </div>
    </>
  )
}
