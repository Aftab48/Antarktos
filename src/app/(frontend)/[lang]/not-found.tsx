import { headers } from 'next/headers'

import { href, translator } from '@/i18n'

import { h1 } from '../_lib/ui'

// not-found gets no params: the language comes from the browser path (src/proxy.ts).
export default async function NotFound() {
  const l = /^\/hi(\/|\?|$)/.test((await headers()).get('x-path') ?? '') ? 'hi' : 'en'
  const t = translator(l)
  return (
    <div className="max-w-prose">
      <h1 className={h1}>{t('notFound.title')}</h1>
      <p className="mt-4 text-lg">{t('notFound.body')}</p>
      <a href={href(l, '/')} className="mt-6 inline-block underline underline-offset-4">{t('notFound.home')}</a>
    </div>
  )
}
