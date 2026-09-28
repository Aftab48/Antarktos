import { notFound } from 'next/navigation'
import { href, translator } from '@/i18n'
import { findOne, pageLocale, type Params } from '../../../_lib/data'
import { PostBody, postTitle } from '../../../_lib/outreach'
import { BackLink } from '../../../_lib/ui'

export async function generateMetadata({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const post = await findOne('outreach-posts', (await params).id)
  return { title: post ? postTitle(post, l) : translator(l)('notFound.title') }
}
export default async function NewsPost({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const post = await findOne('outreach-posts', (await params).id)
  if (!post || post.platform === 'student_explainer') notFound()
  return <article className="mx-auto max-w-3xl pt-10"><div className="mb-6 text-sm"><BackLink to={href(l, '/news')}>{translator(l)('news.back')}</BackLink></div><PostBody post={post} l={l} /></article>
}
