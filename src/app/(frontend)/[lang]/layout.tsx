import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { href, otherLocaleHref, translator, type Key } from '@/i18n'

import { pageLocale, type Params } from '../_lib/data'
import { ThemeToggle } from '../_lib/ThemeToggle'
import { BrandMark } from '../_lib/ui'
import '../styles.css'

// Self-hosted at build time (no runtime request to Google). The width axis gives the condensed headings.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = translator(await pageLocale(params))
  return { title: { template: `%s | ${t('site.name')}`, default: t('site.name') }, description: t('site.tagline'), icons: '/icon.svg' }
}

// The brand is the home link; About lives in the footer and the mobile menu.
const NAV: [string, Key][] = [
  ['/expeditions', 'nav.expeditions'],
  ['/stations', 'nav.stations'],
  ['/archive', 'nav.archive'],
  ['/ask', 'nav.ask'],
  ['/learn', 'nav.learn'],
  ['/news', 'nav.news'],
]
const MENU: [string, Key][] = [...NAV, ['/about', 'nav.about']]
const FOOTER: [string, Key][] = [['/about', 'nav.about'], ['/archive', 'nav.archive'], ['/ask', 'nav.ask'], ['/learn', 'nav.learn'], ['/compare', 'compare.title'], ['/news', 'nav.news']]
// Runs before first paint so a dark page never flashes light: the saved choice, else the OS setting.
const THEME = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default async function Layout({ children, params }: { children: ReactNode; params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const other = l === 'en' ? 'hi' : 'en'
  // Browser path from src/proxy.ts (with /hi for Hindi and the query), for the toggle and the current nav item.
  const raw = (await headers()).get('x-path') ?? ''
  const path = raw.startsWith('/') && !raw.startsWith('//') ? raw : href(l, '/')
  const bare = path.replace(/^\/hi(?=\/|\?|$)/, '').split('?')[0] || '/'
  const section = '/' + (bare.split('/')[1] ?? '')
  const current = (p: string) => (section === p ? (bare === p ? 'page' : 'true') : undefined)
  const toggle = (
    <a
      href={otherLocaleHref(l, path)}
      hrefLang={other}
      lang={other}
      className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-frost/60 px-4 font-medium text-snow hover:bg-deep"
    >
      {t('lang.switch')}
    </a>
  )

  return (
    // suppressHydrationWarning: the theme script adds `dark` to the class before React hydrates.
    <html lang={l} dir="ltr" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only rounded-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-snow focus:px-4 focus:py-3 focus:text-night">
          {t('skip')}
        </a>
        <header className="relative bg-night text-snow">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <a href={href(l, '/')} className="mr-auto inline-flex min-h-11 items-center gap-3 text-snow no-underline">
              <BrandMark />
              <span className="font-display text-2xl">{t('site.name')}</span>
            </a>
            <nav aria-label={t('nav.label')} className="hidden lg:flex">
              <ul className="flex">
                {NAV.map(([p, key]) => (
                  <li key={p}>
                    <a
                      href={href(l, p)}
                      aria-current={current(p)}
                      className="inline-flex min-h-16 items-center px-3 font-medium text-frost no-underline hover:text-snow aria-[current]:text-snow aria-[current]:shadow-[inset_0_-3px_0_var(--signal)]"
                    >
                      {t(key)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle label={t('theme.dark')} />
            {toggle}
            {/* Native disclosure: keyboard and screen-reader support without script. Tab order = visual order. */}
            <details className="group lg:hidden">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-md border border-frost/60 px-4 font-medium text-snow select-none hover:bg-deep group-open:bg-deep [&::-webkit-details-marker]:hidden">
                {t('nav.menu')}
              </summary>
              <nav aria-label={t('nav.label')} className="absolute inset-x-0 top-full z-40 bg-deep">
                <ul className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
                  {MENU.map(([p, key]) => (
                    <li key={p} className="border-b border-night">
                      <a
                        href={href(l, p)}
                        aria-current={current(p)}
                        className="flex min-h-12 items-center text-lg font-medium text-snow no-underline hover:text-glacier aria-[current]:shadow-[inset_3px_0_0_var(--signal)] aria-[current]:pl-4"
                      >
                        {t(key)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 focus:outline-none sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-rule bg-ice text-slate">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_12rem_minmax(0,1.4fr)] lg:px-8">
            <div>
              <a href={href(l, '/')} className="inline-flex min-h-11 items-center gap-3 text-night no-underline">
                <BrandMark />
                <span className="font-display text-2xl">{t('site.name')}</span>
              </a>
              <p className="mt-2 max-w-[20rem]">{t('site.tagline')}</p>
            </div>
            <nav aria-label={t('nav.footer')}>
              <ul>
                {FOOTER.map(([p, key]) => (
                  <li key={p}>
                    <a href={href(l, p)} className="inline-flex min-h-11 items-center text-night no-underline hover:underline">
                      {t(key)}
                    </a>
                  </li>
                ))}
                <li>
                  <a href={otherLocaleHref(l, path)} hrefLang={other} lang={other} className="inline-flex min-h-11 items-center text-night no-underline hover:underline">
                    {t('lang.switch')}
                  </a>
                </li>
              </ul>
            </nav>
            <div className="flex flex-col gap-4 text-sm">
              <p>{t('site.sources')}</p>
              <p>{t('site.disclaimer')}</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
