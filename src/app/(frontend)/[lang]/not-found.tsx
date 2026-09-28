import { headers } from 'next/headers'

import { href, translator } from '@/i18n'

import { btn, btnSecondary, PageHead } from '../_lib/ui'

// not-found gets no params: the language comes from the browser path (src/proxy.ts).
export default async function NotFound() {
  const l = /^\/hi(\/|\?|$)/.test((await headers()).get('x-path') ?? '') ? 'hi' : 'en'
  const t = translator(l)
  return (
    <>
      <PageHead title={t('notFound.title')} intro={t('notFound.body')} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <a href={href(l, '/archive')} className={btn}>{t('home.browse')}</a>
        <a href={href(l, '/ask')} className={btnSecondary}>{t('ask.title')}</a>
        <a href={href(l, '/')} className="inline-flex min-h-11 items-center underline">{t('notFound.home')}</a>
      </div>
    </>
  )
}
