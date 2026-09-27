import config from '@payload-config'
import { getPayload } from 'payload'
import { Badge } from '@/components/ui/badge'
import { CitationText } from '@/components/outreach/CitationText'
import { formatDate, formatNumber, href, translator, type Key, type Locale } from '@/i18n'
import { outreachCitations } from '@/outreach/citation-data'
import { copyText, type CitationSource } from '@/outreach/presentation'
import { cardInput } from '@/outreach/instagram-card'
import { type Doc, rel } from './data'
import { en, MediaImage } from './ui'
import { ShareActions } from '../[lang]/news/ShareActions'

export const platformLabel = (l: Locale, platform: string) => translator(l)(`platform.${platform}` as Key)
export const postPath = (post: Doc) => `/${post.platform === 'student_explainer' ? 'learn' : 'news'}/${post.id}`
export const postTitle = (post: Doc, l: Locale) => (typeof post.title === 'string' ? post.title.replace(/\s*\[c:[^\]]*\]/g, '').trim() : '') || platformLabel(l, post.platform)

export function PostCard({ post, l }: { post: Doc; l: Locale }) {
  const t = translator(l)
  const media = rel(post.suggested_media)
  return <article className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5">
    {media && <MediaImage m={media} l={l} sizes="(min-width: 768px) 30vw, 90vw" className="aspect-[3/2] w-full rounded-lg object-cover" />}
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Badge variant="secondary">{platformLabel(l, post.platform)}</Badge><time dateTime={post.createdAt}>{formatDate(l, post.createdAt)}</time></div>
    <h2 lang={post.title ? post.language : l} className="text-xl font-semibold"><a href={href(l, postPath(post))} className="underline-offset-4 hover:underline">{postTitle(post, l)}</a></h2>
    <p className="line-clamp-3 text-muted-foreground" lang={post.language}>{copyText({ body: post.body })}</p>
    <a href={href(l, postPath(post))} className="mt-auto text-sm font-medium underline underline-offset-4">{t(post.platform === 'student_explainer' ? 'learn.read' : 'outreach.read')}</a>
  </article>
}

export function Sources({ sources, l }: { sources: CitationSource[]; l: Locale }) {
  const t = translator(l)
  return <section aria-labelledby="outreach-sources" className="mt-8 border-t pt-6"><h2 id="outreach-sources" className="mb-3 text-xl font-semibold">{t('summary.sources')}</h2>
    {sources.length ? <ol className="grid gap-3">{sources.map((s, index) => <li key={s.id} id={`source-${s.id}`} className="rounded-lg border p-4">
      <span className="mr-2 font-medium">[{formatNumber(l, index + 1)}]</span><a href={s.recordUrl} lang={s.titleLocale} className="underline underline-offset-4">{s.title}</a>
      {s.pageUrl && <a href={s.pageUrl} className="ml-3 text-sm underline underline-offset-4">{t('summary.page', { page: formatNumber(l, s.page!) })}</a>}
    </li>)}</ol> : <p className="text-muted-foreground">{t('outreach.sourcesUnavailable')}</p>}
  </section>
}

export async function PostBody({ post, l, children }: { post: Doc; l: Locale; children?: React.ReactNode }) {
  const t = translator(l)
  const contentLocale = post.language === 'hi' ? 'hi' : 'en'
  const sources = await outreachCitations(await getPayload({ config }), post, l)
  const media = rel(post.suggested_media)
  return <>
    <p className="mb-5 text-sm text-muted-foreground">{t('outreach.reviewed')}</p>
    {contentLocale !== l && <p className="mb-5 rounded-lg border border-dashed p-3">{t('lang.fallback')}</p>}
    <div className="mb-3 flex flex-wrap items-center gap-3"><Badge>{platformLabel(l, post.platform)}</Badge><time dateTime={post.createdAt} className="text-sm text-muted-foreground">{formatDate(l, post.createdAt)}</time></div>
    <h1 lang={contentLocale} className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{postTitle(post, l)}</h1>
    {media && <figure className="mb-8"><MediaImage m={media} l={l} sizes="(min-width: 1024px) 48rem, 95vw" eager className="max-h-[32rem] w-full rounded-xl object-contain" />{media.credit && <figcaption className="mt-2 text-sm text-muted-foreground">{t('field.credit')}: {en(l, media.credit)}{media.license && <> · {en(l, media.license)}</>}</figcaption>}</figure>}
    {[post.dateline, ...(post.thread?.length ? post.thread.map((p: Doc) => p.text) : [post.body]), post.about].filter(Boolean).map((value, index) => <div key={index} className="mb-5"><CitationText text={value} sources={sources} locale={contentLocale} uiLocale={l} publicStyle /></div>)}
    {post.hashtags?.length > 0 && <p lang={contentLocale} className="my-5 break-words text-sm text-muted-foreground">{post.hashtags.join(' ')}</p>}
    <ShareActions post={{ language: contentLocale, id: post.id, platform: post.platform, title: post.title, body: post.body, hashtags: post.hashtags, thread: post.thread, dateline: post.dateline, about: post.about, suggested_media: Boolean(media), cardAvailable: Boolean(cardInput(post, process.env.R2_PUBLIC_URL ?? '')) }} l={l} />
    {children}
    <Sources sources={sources} l={l} />
  </>
}
