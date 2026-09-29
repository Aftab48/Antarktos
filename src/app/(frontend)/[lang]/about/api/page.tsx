import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { href, translator, type Key } from '@/i18n'

import { pageLocale, type Params } from '../../../_lib/data'
import { BackLink, h2, PageHead } from '../../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('api.title') }
}

// Payload's own REST API is the open data API: read-only for visitors, published records only (plan §8.2).
const COLLECTIONS = ['expeditions', 'stations', 'reports', 'datasets', 'publications', 'media', 'events', 'outreach-posts'] as const

const EXAMPLES: [Key, string][] = [
  ['api.exList', '/api/expeditions?sort=-season_start&limit=10'],
  ['api.exFilter', '/api/reports?where[region][equals]=arctic&depth=1'],
  ['api.exHindi', '/api/datasets?locale=hi'],
  ['api.exOne', '/api/stations/3'],
  ['api.exSearch', '/api/search?q=Himadri&locale=en'],
]

const PARAMS: [string, Key][] = [
  ['locale', 'api.pLocale'],
  ['where[field][operator]', 'api.pWhere'],
  ['sort', 'api.pSort'],
  ['limit, page', 'api.pLimit'],
  ['depth', 'api.pDepth'],
  ['select[field]', 'api.pSelect'],
]

const code = 'rounded bg-ice px-1.5 py-0.5 font-mono text-[0.9em]'

export default async function ApiDocs({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  // Examples use the address the page was opened on, so they work locally and on the deployed site.
  const h = await headers()
  const base = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  return (
    <>
      <PageHead back={<BackLink to={href(l, '/about')}>{t('about.title')}</BackLink>} title={t('api.title')} intro={t('api.intro')} />
      <div className="flex max-w-[65ch] flex-col gap-14">
        <section aria-labelledby="api-collections">
          <h2 id="api-collections" className={h2}>{t('api.collections')}</h2>
          <table className="w-full text-left">
            <thead className="text-sm text-slate">
              <tr className="border-b border-rule"><th scope="col" className="py-2 pr-4 font-medium">{t('api.path')}</th><th scope="col" className="py-2 font-medium">{t('api.contains')}</th></tr>
            </thead>
            <tbody>
              {COLLECTIONS.map((c) => (
                <tr key={c} className="border-b border-rule">
                  <td className="py-3 pr-4"><code lang="en" className={code}>/api/{c}</code></td>
                  <td className="py-3">{t(c === 'outreach-posts' ? 'api.posts' : `type.${c}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-slate">{t('api.files')}</p>
        </section>

        <section aria-labelledby="api-examples">
          <h2 id="api-examples" className={h2}>{t('api.examples')}</h2>
          <ul className="flex flex-col gap-6">
            {EXAMPLES.map(([label, path]) => (
              <li key={path}>
                <p className="mb-2 font-medium">{t(label)}</p>
                {/* font-mono on <code> itself: the base `:lang(en)` rule would give it Archivo, whose & reads as a glyph.
                    Long URLs wrap inside the box (copying keeps one line), so no sideways scroll at 375px. */}
                <pre lang="en" className="rounded-lg bg-night p-4 text-sm whitespace-pre-wrap break-words text-snow"><code className="font-mono">curl -g &quot;{base}{path}&quot;</code></pre>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="api-params">
          <h2 id="api-params" className={h2}>{t('api.params')}</h2>
          <dl className="grid gap-4">
            {PARAMS.map(([name, desc]) => (
              <div key={name}>
                <dt><code lang="en" className={code}>{name}</code></dt>
                <dd className="mt-1 text-slate">{t(desc)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-sm text-slate">{t('api.license')}</p>
      </div>
    </>
  )
}
