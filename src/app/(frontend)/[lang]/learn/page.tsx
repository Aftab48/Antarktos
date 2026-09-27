import { href, translator, type Key } from '@/i18n'
import { TOPICS } from '@/outreach/presentation'
import { find, pageLocale, type Params } from '../../_lib/data'
import { PostCard } from '../../_lib/outreach'
import { h1 } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }) { return { title: translator(await pageLocale(params))('learn.title') } }

export default async function Learn({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const { docs } = await find('outreach-posts', { where: { and: [{ language: { equals: l } }, { platform: { equals: 'student_explainer' } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, sort: '-createdAt', limit: 0, depth: 1 })
  const groups = TOPICS.map((topic) => ({ topic, posts: docs.filter((d) => d.topic === topic) })).filter((group) => group.posts.length)
  return <><h1 className={h1}>{t('learn.title')}</h1><p className="mt-3 mb-6 max-w-3xl text-muted-foreground">{t('learn.intro')}</p><a href={href(l, '/ask')} className="inline-block text-sm font-medium underline underline-offset-4">{t('learn.ask')}</a>
    {groups.length ? <><nav aria-label={t('learn.topics')} className="my-7"><ul className="flex flex-wrap gap-3">{groups.map(({ topic }) => <li key={topic}><a href={`#${topic}`} className="rounded-full border px-4 py-2 text-sm hover:bg-muted">{t(`topic.${topic}` as Key)}</a></li>)}</ul></nav>
      {groups.map(({ topic, posts }) => <section id={topic} key={topic} className="my-10 scroll-mt-6" aria-labelledby={`title-${topic}`}><h2 id={`title-${topic}`} className="mb-5 text-2xl font-semibold">{t(`topic.${topic}` as Key)}</h2><ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <li key={post.id}><PostCard post={post} l={l} /></li>)}</ul></section>)}</> : <p className="portal-empty mt-8">{t('learn.empty')}</p>}
  </>
}
