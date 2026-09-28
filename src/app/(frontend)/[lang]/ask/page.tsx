import type { Metadata } from 'next'

import { translator } from '@/i18n'
import { pageLocale, type Params } from '../../_lib/data'
import { PageHead } from '../../_lib/ui'
import { AskForm } from './AskForm'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('ask.title') }
}

export default async function AskPage({ params }: { params: Params }) {
  const locale = await pageLocale(params)
  const t = translator(locale)
  return <>
    <PageHead title={t('ask.title')} intro={t('ask.intro')} />
    <div className="max-w-3xl">
      <AskForm locale={locale} />
    </div>
  </>
}
