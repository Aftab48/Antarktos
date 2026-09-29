import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { formatNumber, formatYear, href, translator, type Locale } from '@/i18n'

import { count, find, findOne, pageLocale, pick, RECORD_TYPES, rels, text, type Doc, type Params } from '../../_lib/data'
import { btn, coordinates, en, L, label, PageHead, season } from '../../_lib/ui'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: translator(await pageLocale(params))('compare.title') }
}

type Search = Promise<Record<string, string | string[] | undefined>>
type Kind = 'expeditions' | 'stations'
type Row = [string, (d: Doc) => ReactNode]

// Two expeditions or two stations side by side, read straight from the published records (no AI involved).
export default async function Compare({ params, searchParams }: { params: Params; searchParams: Search }) {
  const l = await pageLocale(params)
  const t = translator(l)
  const sp = await searchParams
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const kind: Kind = one('type') === 'stations' ? 'stations' : 'expeditions'
  const nameField = kind === 'stations' ? 'name' : 'title'

  const [options, a, b] = await Promise.all([
    find(kind, { sort: kind === 'stations' ? 'name' : 'season_start', limit: 0 }),
    one('a') ? findOne(kind, one('a')) : null,
    one('b') ? findOne(kind, one('b')) : null,
  ])
  const picked = [a, b].filter((d): d is Doc => Boolean(d))
  // Published records linked to each one; a station also counts the expeditions that went there.
  const countTypes = [...(kind === 'stations' ? (['expeditions'] as const) : []), ...RECORD_TYPES]
  const counts = await Promise.all(
    picked.map((d) => Promise.all(countTypes.map((c) => count(c, kind === 'expeditions' ? { expedition: { equals: d.id } } : { stations: { in: [d.id] } })))),
  )
  const select = 'mt-1 block min-h-11 w-full rounded-md border border-control bg-snow px-3 font-normal'
  const tab = (k: Kind) => `inline-flex min-h-11 items-center rounded-md border px-4 font-medium no-underline ${k === kind ? 'border-night bg-night text-snow' : 'border-control bg-snow hover:bg-ice'}`

  const rows: Row[] =
    kind === 'expeditions'
      ? [
          [t('field.season'), (d) => season(d, l)],
          [t('field.region'), (d) => label(l, 'region', d.region)],
          [t('field.leader'), (d) => en(l, d.leader)],
          [t('field.stations'), (d) => rels(d.stations).length > 0 && <Links docs={rels(d.stations)} l={l} kind="stations" />],
        ]
      : [
          [t('field.region'), (d) => label(l, 'region', d.region)],
          [t('field.status'), (d) => label(l, 'status', d.operational_status)],
          [t('field.established'), (d) => d.established && formatYear(l, d.established)],
          [t('field.closed'), (d) => d.decommissioned && formatYear(l, d.decommissioned)],
          [t('field.coordinates'), (d) => coordinates(l, d.lat, d.lng)],
        ]

  return (
    <>
      <PageHead title={t('compare.title')} intro={t('compare.intro')}>
        <nav aria-label={t('compare.kind')} className="mt-8">
          <ul className="flex flex-wrap gap-3">
            {(['expeditions', 'stations'] as const).map((k) => (
              <li key={k}>
                <a href={href(l, `/compare?type=${k}`)} aria-current={k === kind ? 'page' : undefined} className={tab(k)}>{t(`type.${k}`)}</a>
              </li>
            ))}
          </ul>
        </nav>
        <form method="get" action={href(l, '/compare')} className="mt-6 grid max-w-[48rem] gap-4 text-sm font-medium sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="type" value={kind} />
          {(['a', 'b'] as const).map((k, i) => (
            <label key={k}>
              {t(i ? 'compare.second' : 'compare.first')}
              <select name={k} defaultValue={[a, b][i]?.id ?? ''} required className={select}>
                <option value="">{t('compare.choose')}</option>
                {options.docs.map((d) => (
                  <option key={d.id} value={d.id} lang={pick(d[nameField], l)?.lang}>{text(d[nameField], l)}</option>
                ))}
              </select>
            </label>
          ))}
          <button type="submit" className={btn}>{t('compare.submit')}</button>
        </form>
      </PageHead>

      {picked.length === 2 ? (
        <div>
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">{t('compare.caption', { a: text(a![nameField], l), b: text(b![nameField], l) })}</caption>
            <thead>
              <tr className="border-b-2 border-night align-bottom">
                <td className="w-[28%] sm:w-1/4" />
                {picked.map((d) => (
                  <th key={d.id} scope="col" className="px-2 pb-3 font-display text-lg break-words sm:px-3 sm:text-3xl">
                    <a href={href(l, `/${kind}/${d.id}`)} className="underline decoration-transparent hover:decoration-night"><L v={d[nameField]} l={l} /></a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, value]) => (
                <tr key={name} className="border-b border-rule align-top">
                  <th scope="row" className="py-3 pr-3 text-sm font-normal text-slate">{name}</th>
                  {picked.map((d) => <td key={d.id} className="px-2 py-3 break-words sm:px-3">{value(d) || <span className="text-slate">—</span>}</td>)}
                </tr>
              ))}
              <tr>
                <th colSpan={3} scope="colgroup" className="pt-8 pb-2 text-left font-semibold">{t('compare.records')}</th>
              </tr>
              {countTypes.map((c, i) => (
                <tr key={c} className="border-b border-rule">
                  <th scope="row" className="py-3 pr-3 text-sm font-normal text-slate">{t(`type.${c}`)}</th>
                  {picked.map((d, j) => <td key={d.id} className="px-2 py-3 font-figures text-lg sm:px-3">{formatNumber(l, counts[j][i])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-lg text-slate">{t('compare.pick')}</p>
      )}
    </>
  )
}

function Links({ docs, l, kind }: { docs: Doc[]; l: Locale; kind: Kind }) {
  return (
    <ul>
      {docs.map((s) => (
        <li key={s.id}>
          <a href={href(l, `/${kind}/${s.id}`)} className="underline"><L v={s.name ?? s.title} l={l} /></a>
        </li>
      ))}
    </ul>
  )
}
