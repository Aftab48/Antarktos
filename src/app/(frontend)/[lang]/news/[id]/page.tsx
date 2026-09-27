import { notFound } from 'next/navigation'
import { href, translator } from '@/i18n'
import { findOne, pageLocale, type Params } from '../../../_lib/data'
import { PostBody, postTitle } from '../../../_lib/outreach'

export async function generateMetadata({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const post = await findOne('outreach-posts', (await params).id)
  return { title: post ? postTitle(post, l) : translator(l)('notFound.title') }
}
export default async function NewsPost({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const post = await findOne('outreach-posts', (await params).id)
  if (!post || post.platform === 'student_explainer') notFound()
  return <article className="mx-auto max-w-3xl"><a href={href(l, '/news')} className="mb-6 inline-block text-sm underline underline-offset-4">{translator(l)('news.back')}</a><PostBody post={post} l={l} /></article>
}
