import type { Metadata } from 'next'

import { translator } from '@/i18n'
import { pageLocale, type Params } from '../../_lib/data'
import { h1 } from '../../_lib/ui'
import { AskForm } from './AskForm'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('ask.title') }
}

export default async function AskPage({ params }: { params: Params }) {
  const locale = await pageLocale(params)
  const t = translator(locale)
  return <div className="max-w-3xl">
    <h1 className={h1}>{t('ask.title')}</h1>
    <p className="mt-3 leading-relaxed text-muted-foreground">{t('ask.intro')}</p>
    <AskForm locale={locale} />
  </div>
}
