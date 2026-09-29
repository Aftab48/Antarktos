import type { Metadata } from 'next'

import { href, translator, type Key } from '@/i18n'

import { pageLocale, type Params } from '../../_lib/data'
import { h2Base, PageHead } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('about.title') }
}

const SECTIONS: [Key, Key][] = [
  ['about.what', 'about.whatBody'],
  ['about.sources', 'about.sourcesBody'],
  ['about.ai', 'about.aiBody'],
  ['about.languages', 'about.languagesBody'],
]

export default async function About({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  return (
    <>
      <PageHead title={t('about.title')} />
      <div className="max-w-[65ch]">
        {SECTIONS.map(([heading, body]) => (
          <section key={heading} className="mb-12">
            <h2 className={`${h2Base} mb-4`}>{t(heading)}</h2>
            <p className="text-lg leading-relaxed">{t(body)}</p>
          </section>
        ))}
        <p className="mb-12 text-lg"><a href={href(l, '/about/api')} className="font-medium underline">{t('api.link')}</a></p>
        <p className="text-sm text-slate">{t('site.disclaimer')}</p>
      </div>
    </>
  )
}
