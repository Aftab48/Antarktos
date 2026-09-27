import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { href, otherLocaleHref, translator, type Key } from '@/i18n'

import { pageLocale, type Params } from '../_lib/data'
import '../styles.css'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = translator(await pageLocale(params))
  return { title: { template: `%s | ${t('site.name')}`, default: t('site.name') }, description: t('site.tagline'), icons: '/icon.svg' }
}

// Next steps add /news and /learn (step 8).
const NAV: [string, Key][] = [
  ['/', 'nav.home'],
  ['/expeditions', 'nav.expeditions'],
  ['/stations', 'nav.stations'],
  ['/archive', 'nav.archive'],
  ['/ask', 'nav.ask'],
  ['/about', 'nav.about'],
]

export default async function Layout({ children, params }: { children: ReactNode; params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const other = l === 'en' ? 'hi' : 'en'
  // Browser path from src/proxy.ts (with /hi for Hindi and the query), for the toggle and the current nav item.
  const raw = (await headers()).get('x-path') ?? ''
  const path = raw.startsWith('/') && !raw.startsWith('//') ? raw : href(l, '/')
  const bare = path.replace(/^\/hi(?=\/|\?|$)/, '').split('?')[0] || '/'
  const section = '/' + (bare.split('/')[1] ?? '')

  return (
    <html lang={l}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only rounded-md bg-background px-4 py-2 shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
          {t('skip')}
        </a>
        <header className="border-t-4 border-t-primary border-b bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <a href={href(l, '/')} className="mr-auto text-lg font-semibold text-primary">
              {t('site.name')}
            </a>
            <a
              href={otherLocaleHref(l, path)}
              hrefLang={other}
              lang={other}
              className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted"
            >
              {t('lang.switch')}
            </a>
            {/* Own row at every width, so the visual order matches the tab order. */}
            <nav aria-label={t('nav.label')} className="w-full">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {NAV.map(([p, key]) => {
                  const current = p === '/' ? bare === '/' : section === p
                  return (
                    <li key={p}>
                      <a
                        href={href(l, p)}
                        aria-current={current ? (bare === p ? 'page' : 'true') : undefined}
                        className="inline-block py-1 underline-offset-8 hover:underline aria-[current]:font-semibold aria-[current]:text-primary aria-[current]:underline aria-[current]:decoration-2"
                      >
                        {t(key)}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none">
          {children}
        </main>
        <footer className="mt-12 border-t bg-muted/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
            <p>{t('site.sources')}</p>
            <p>{t('site.disclaimer')}</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
