import { formatNumber, href, translator } from '@/i18n'
import { find, pageLocale, type Params } from '../../_lib/data'
import { PostCard } from '../../_lib/outreach'
import { h1 } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }) { return { title: translator(await pageLocale(params))('news.title') } }

export default async function News({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string }> }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const rawPage = (await searchParams).page ?? '1'
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1
  const result = await find('outreach-posts', { where: { and: [{ language: { equals: l } }, { platform: { not_equals: 'student_explainer' } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, sort: '-createdAt', page, limit: 12, depth: 1 })
  return <><h1 className={h1}>{t('news.title')}</h1><p className="mt-3 mb-8 max-w-3xl text-muted-foreground">{t('news.intro')}</p>
    {result.docs.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.docs.map((post) => <li key={post.id}><PostCard post={post} l={l} /></li>)}</ul> : <p className="portal-empty">{t('news.empty')}</p>}
    {result.totalPages > 1 && <nav aria-label={t('archive.pagination')} className="mt-8 flex flex-wrap items-center justify-between gap-3">{result.hasPrevPage && <a className="underline" href={href(l, `/news?page=${page - 1}`)}>{t('archive.prev')}</a>}<span>{t('archive.pageOf', { page: formatNumber(l, page), total: formatNumber(l, result.totalPages) })}</span>{result.hasNextPage && <a className="underline" href={href(l, `/news?page=${page + 1}`)}>{t('archive.next')}</a>}</nav>}
  </>
}
