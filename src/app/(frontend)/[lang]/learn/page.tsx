import { href, translator, type Key } from '@/i18n'
import { TOPICS } from '@/outreach/presentation'
import { find, pageLocale, type Params } from '../../_lib/data'
import { PostCard } from '../../_lib/outreach'
import { Empty, h2, PageHead } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }) { return { title: translator(await pageLocale(params))('learn.title') } }

export default async function Learn({ params }: { params: Params }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const { docs } = await find('outreach-posts', { where: { and: [{ language: { equals: l } }, { platform: { equals: 'student_explainer' } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, sort: '-createdAt', limit: 0, depth: 1 })
  const groups = TOPICS.map((topic) => ({ topic, posts: docs.filter((d) => d.topic === topic) })).filter((group) => group.posts.length)
  return <><PageHead title={t('learn.title')} intro={t('learn.intro')}>
      <p className="mt-4 flex flex-wrap gap-x-6"><a href={href(l, '/ask')} className="inline-flex min-h-11 items-center font-medium underline">{t('learn.ask')}</a><a href={href(l, '/compare')} className="inline-flex min-h-11 items-center font-medium underline">{t('compare.learn')}</a></p>
      {groups.length > 0 && <nav aria-label={t('learn.topics')} className="mt-6"><ul className="flex flex-wrap gap-3">{groups.map(({ topic }) => <li key={topic}><a href={`#${topic}`} className="inline-flex min-h-11 items-center rounded-md border border-control bg-snow px-4 font-medium no-underline hover:bg-ice">{t(`topic.${topic}` as Key)}</a></li>)}</ul></nav>}
    </PageHead>
    {groups.length ? groups.map(({ topic, posts }) => <section id={topic} key={topic} className="mb-16 scroll-mt-6" aria-labelledby={`title-${topic}`}><h2 id={`title-${topic}`} className={h2}>{t(`topic.${topic}` as Key)}</h2><ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <li key={post.id}><PostCard post={post} l={l} /></li>)}</ul></section>)
      : <Empty message={t('learn.empty')} action={t('ask.title')} to={href(l, '/ask')} />}
  </>
}
