import config from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { href, translator } from '@/i18n'
import { outreachCitations } from '@/outreach/citation-data'
import { findOne, pageLocale, type Params } from '../../../_lib/data'
import { PostBody, postTitle } from '../../../_lib/outreach'
import { Quiz } from '../Quiz'

export async function generateMetadata({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const post = await findOne('outreach-posts', (await params).id)
  return { title: post ? postTitle(post, l) : translator(l)('notFound.title') }
}
export default async function Explainer({ params }: { params: Params<{ id: string }> }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const post = await findOne('outreach-posts', (await params).id)
  if (!post || post.platform !== 'student_explainer') notFound()
  const sources = await outreachCitations(await getPayload({ config }), post, l)
  return <article className="mx-auto max-w-3xl"><a href={href(l, '/learn')} className="mb-6 inline-block text-sm underline underline-offset-4">{t('learn.back')}</a>
    <PostBody post={post} l={l}><Quiz items={post.quiz} sources={sources} l={l} contentLocale={post.language === 'hi' ? 'hi' : 'en'} /><a href={href(l, '/ask')} className="inline-block rounded-lg border px-4 py-3 font-medium underline underline-offset-4">{t('learn.ask')}</a></PostBody>
  </article>
}
