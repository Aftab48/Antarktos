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

const NAV: [string, Key][] = [
  ['/', 'nav.home'],
  ['/expeditions', 'nav.expeditions'],
  ['/stations', 'nav.stations'],
  ['/archive', 'nav.archive'],
  ['/ask', 'nav.ask'],
  ['/news', 'nav.news'],
  ['/learn', 'nav.learn'],
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
    <html lang={l} dir="ltr">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only rounded-md bg-background px-4 py-2 shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
          {t('skip')}
        </a>
        <header className="portal-header border-t-4 border-t-primary border-b bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-5">
            <a href={href(l, '/')} className="portal-brand mr-auto flex items-center gap-3 font-semibold text-primary">
              {/* Decorative portal mark, not an official government emblem. */}
              <svg aria-hidden="true" viewBox="0 0 32 32" className="size-11 shrink-0 rounded-lg bg-primary p-2 text-white"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3v26M5 9.5l22 13M5 22.5l22-13M12 6l4 3 4-3M12 26l4-3 4 3" /></g></svg>
              <span><span className="block text-xl">{t('site.name')}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t('site.tagline')}</span></span>
            </a>
            <a
              href={otherLocaleHref(l, path)}
              hrefLang={other}
              lang={other}
              className="inline-flex min-h-11 items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t('lang.switch')}
            </a>
            {/* Own row at every width, so the visual order matches the tab order. */}
            <nav aria-label={t('nav.label')} className="portal-nav mt-3 w-full border-t">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {NAV.map(([p, key]) => {
                  const current = p === '/' ? bare === '/' : section === p
                  return (
                    <li key={p}>
                      <a
                        href={href(l, p)}
                        aria-current={current ? (bare === p ? 'page' : 'true') : undefined}
                        className="inline-flex min-h-12 items-center py-2 underline-offset-8 hover:underline aria-[current]:font-semibold aria-[current]:text-primary aria-[current]:underline aria-[current]:decoration-2"
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
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 focus:outline-none">
          {children}
        </main>
        <footer className="portal-footer mt-12 border-t bg-muted/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
            <p>{t('site.sources')}</p>
            <p>{t('site.disclaimer')}</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
