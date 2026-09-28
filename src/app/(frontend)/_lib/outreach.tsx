import config from '@payload-config'
import { getPayload } from 'payload'
import { CitationText } from '@/components/outreach/CitationText'
import { formatDate, formatNumber, href, translator, type Key, type Locale } from '@/i18n'
import { outreachCitations } from '@/outreach/citation-data'
import { copyText, type CitationSource } from '@/outreach/presentation'
import { cardInput } from '@/outreach/instagram-card'
import { type Doc, rel } from './data'
import { sourceItem, sourceList, sourceNum } from './classes'
import { en, h1, h3, MediaImage, Meta, Reviewed } from './ui'
import { ShareActions } from '../[lang]/news/ShareActions'

export const platformLabel = (l: Locale, platform: string) => translator(l)(`platform.${platform}` as Key)
export const postPath = (post: Doc) => `/${post.platform === 'student_explainer' ? 'learn' : 'news'}/${post.id}`
export const postTitle = (post: Doc, l: Locale) => (typeof post.title === 'string' ? post.title.replace(/\s*\[c:[^\]]*\]/g, '').trim() : '') || platformLabel(l, post.platform)

export function PostCard({ post, l }: { post: Doc; l: Locale }) {
  const t = translator(l)
  const media = rel(post.suggested_media)
  return <article className="flex h-full flex-col gap-3">
    {media && <MediaImage m={media} l={l} sizes="(min-width: 768px) 30vw, 90vw" className="aspect-[3/2] w-full rounded-xl object-cover" />}
    <Meta items={[<span key="p" className="font-medium text-night">{platformLabel(l, post.platform)}</span>, <time key="d" dateTime={post.createdAt}>{formatDate(l, post.createdAt)}</time>]} />
    <h2 lang={post.title ? post.language : l} className={h3}><a href={href(l, postPath(post))} className="underline decoration-transparent hover:decoration-night">{postTitle(post, l)}</a></h2>
    <p className="line-clamp-3 text-slate" lang={post.language}>{copyText({ body: post.body })}</p>
    <a href={href(l, postPath(post))} className="mt-auto inline-flex min-h-11 items-center font-medium underline">{t(post.platform === 'student_explainer' ? 'learn.read' : 'outreach.read')}</a>
  </article>
}

export function Sources({ sources, l }: { sources: CitationSource[]; l: Locale }) {
  const t = translator(l)
  return <section aria-labelledby="outreach-sources" className="mt-12"><h2 id="outreach-sources" className={h3}>{t('summary.sources')}</h2>
    {sources.length ? <ol className={sourceList}>{sources.map((s, index) => <li key={s.id} id={`source-${s.id}`} className={`${sourceItem} target:bg-ice`}>
      <span aria-hidden="true" className={sourceNum}>{formatNumber(l, index + 1)}</span>
      <div className="min-w-0"><a href={s.recordUrl} lang={s.titleLocale} className="font-semibold underline"><span className="sr-only">{t('ask.source', { n: index + 1 })}: </span>{s.title}</a>
      {s.pageUrl && <a href={s.pageUrl} className="ml-4 text-sm text-slate underline">{t('summary.page', { page: formatNumber(l, s.page!) })}</a>}</div>
    </li>)}</ol> : <p className="mt-4 text-slate">{t('outreach.sourcesUnavailable')}</p>}
  </section>
}

export async function PostBody({ post, l, children }: { post: Doc; l: Locale; children?: React.ReactNode }) {
  const t = translator(l)
  const contentLocale = post.language === 'hi' ? 'hi' : 'en'
  const sources = await outreachCitations(await getPayload({ config }), post, l)
  const media = rel(post.suggested_media)
  return <>
    <Meta className="mb-4" items={[<span key="p" className="font-medium text-night">{platformLabel(l, post.platform)}</span>, <time key="d" dateTime={post.createdAt}>{formatDate(l, post.createdAt)}</time>]} />
    <h1 lang={contentLocale} className={h1}>{postTitle(post, l)}</h1>
    <p className="mt-4 mb-8 flex items-start gap-2 text-sm text-slate"><Reviewed />{t('outreach.reviewed')}</p>
    {contentLocale !== l && <p className="mb-8 max-w-[40rem] rounded-xl border border-dashed border-control px-4 py-3 text-sm">{t('lang.fallback')}</p>}
    {media && <figure className="mb-8"><MediaImage m={media} l={l} sizes="(min-width: 1024px) 48rem, 95vw" eager className="max-h-[32rem] w-full rounded-xl bg-ice object-contain" />{media.credit && <figcaption className="mt-2"><Meta items={[<>{t('field.credit')}: {en(l, media.credit)}</>, media.license && en(l, media.license)]} /></figcaption>}</figure>}
    <div className="text-lg">{[post.dateline, ...(post.thread?.length ? post.thread.map((p: Doc) => p.text) : [post.body]), post.about].filter(Boolean).map((value, index) => <div key={index} className="mb-5"><CitationText text={value} sources={sources} locale={contentLocale} uiLocale={l} publicStyle /></div>)}</div>
    {post.hashtags?.length > 0 && <p lang={contentLocale} className="my-5 break-words text-sm text-slate">{post.hashtags.join(' ')}</p>}
    <ShareActions post={{ language: contentLocale, id: post.id, platform: post.platform, title: post.title, body: post.body, hashtags: post.hashtags, thread: post.thread, dateline: post.dateline, about: post.about, suggested_media: Boolean(media), cardAvailable: Boolean(cardInput(post, process.env.R2_PUBLIC_URL ?? '')) }} l={l} />
    {children}
    <Sources sources={sources} l={l} />
  </>
}
