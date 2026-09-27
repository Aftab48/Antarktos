import type { Metadata } from 'next'

import { translator, type Key } from '@/i18n'

import { pageLocale, type Params } from '../../_lib/data'
import { h1, h2 } from '../../_lib/ui'

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
  const t = translator(await pageLocale(params))
  return (
    <div className="max-w-prose">
      <h1 className={h1}>{t('about.title')}</h1>
      {SECTIONS.map(([heading, body]) => (
        <section key={heading} className="mt-8">
          <h2 className={h2}>{t(heading)}</h2>
          <p className="text-lg">{t(body)}</p>
        </section>
      ))}
      <p className="mt-8 text-sm text-muted-foreground">{t('site.disclaimer')}</p>
    </div>
  )
}
