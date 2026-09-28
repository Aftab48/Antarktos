import { formatNumber, href, translator } from '@/i18n'
import { find, pageLocale, type Params } from '../../_lib/data'
import { PostCard } from '../../_lib/outreach'
import { btnSecondary, Empty, PageHead } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }) { return { title: translator(await pageLocale(params))('news.title') } }

export default async function News({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string }> }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const rawPage = (await searchParams).page ?? '1'
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1
  const result = await find('outreach-posts', { where: { and: [{ language: { equals: l } }, { platform: { not_equals: 'student_explainer' } }, { review_status: { equals: 'approved' } }, { _status: { equals: 'published' } }] }, sort: '-createdAt', page, limit: 12, depth: 1 })
  return <><PageHead title={t('news.title')} intro={t('news.intro')} />
    {result.docs.length ? <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{result.docs.map((post) => <li key={post.id}><PostCard post={post} l={l} /></li>)}</ul> : <Empty message={t('news.empty')} action={t('ask.title')} to={href(l, '/ask')} />}
    {result.totalPages > 1 && <nav aria-label={t('archive.pagination')} className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4"><span>{result.hasPrevPage && <a className={btnSecondary} href={href(l, `/news?page=${page - 1}`)}>{t('archive.prev')}</a>}</span><span className="font-figures text-sm text-slate">{t('archive.pageOf', { page: formatNumber(l, page), total: formatNumber(l, result.totalPages) })}</span><span className="text-right">{result.hasNextPage && <a className={btnSecondary} href={href(l, `/news?page=${page + 1}`)}>{t('archive.next')}</a>}</span></nav>}
  </>
}
