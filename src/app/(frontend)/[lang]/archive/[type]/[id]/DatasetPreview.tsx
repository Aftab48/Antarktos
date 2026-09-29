import { formatDate, formatNumber, formatYear, translator, type Locale } from '@/i18n'

import { lineSeries, parseDelimited, type Series } from '../../../../_lib/csv'
import type { Doc } from '../../../../_lib/data'
import { h2 } from '../../../../_lib/ui'

const HEAD_BYTES = 64 * 1024

// The first 64 KB of a file in R2 (plan §6.3: never the whole file; datasets can be 100 MB).
async function fileHead(url: string): Promise<{ text: string; truncated: boolean } | null> {
  const res = await fetch(url, { headers: { Range: `bytes=0-${HEAD_BYTES - 1}` }, cache: 'no-store', signal: AbortSignal.timeout(5000) })
  if (!res.ok || !res.body) return null
  // A server that ignores Range sends the whole file: stop reading after HEAD_BYTES either way.
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < HEAD_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
  }
  await reader.cancel()
  const total = Number(res.headers.get('content-range')?.split('/')[1] ?? res.headers.get('content-length') ?? size)
  return { text: new TextDecoder().decode(Buffer.concat(chunks).subarray(0, HEAD_BYTES)), truncated: size >= HEAD_BYTES || total > size }
}

const delimiterOf = (doc: Doc) => {
  const name = String(doc.filename ?? '').toLowerCase()
  if (doc.mimeType === 'text/tab-separated-values' || name.endsWith('.tsv')) return '\t'
  if (doc.mimeType === 'text/csv' || name.endsWith('.csv')) return ','
  return null
}

// First rows of an uploaded CSV/TSV, plus one line chart when there is a date column and a number column.
// Cell text is rendered as plain text (React escapes it): file contents are data, never markup or instructions.
export async function DatasetPreview({ doc, l }: { doc: Doc; l: Locale }) {
  const delimiter = delimiterOf(doc)
  const r2 = process.env.R2_PUBLIC_URL
  if (!delimiter || !r2 || typeof doc.url !== 'string' || !doc.url.startsWith(`${r2}/`)) return null
  const head = await fileHead(doc.url).catch(() => null)
  const table = head && parseDelimited(head.text, delimiter, head.truncated)
  if (!table?.rows.length) return null
  const t = translator(l)
  const series = lineSeries(table)
  const dataLang = l === 'en' ? undefined : 'en'
  return (
    <section aria-labelledby="preview" className="flex flex-col gap-4">
      <h2 id="preview" className={h2}>{t('dataset.preview')}</h2>
      <p className="text-slate">{t('dataset.previewNote', { rows: table.rows.length, cols: table.header.length })}</p>
      {series && <Chart series={series} l={l} />}
      <div className="max-h-[28rem] overflow-auto rounded-lg border border-rule" tabIndex={0} role="region" aria-labelledby="preview">
        <table className="w-full text-left text-sm" lang={dataLang}>
          <thead className="sticky top-0 bg-ice">
            <tr>{table.header.map((h, i) => <th key={i} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="font-figures">
            {table.rows.map((row, i) => (
              <tr key={i} className="border-t border-rule">{table.header.map((_, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{row[j] ?? ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const W = 640
const H = 240
const PAD = { left: 64, right: 16, top: 12, bottom: 32 }

function Chart({ series, l }: { series: Series; l: Locale }) {
  const t = translator(l)
  const xs = series.points.map((p) => p[0])
  const ys = series.points.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const sx = (x: number) => PAD.left + ((x - x0) / (x1 - x0 || 1)) * (W - PAD.left - PAD.right)
  const sy = (y: number) => H - PAD.bottom - ((y - y0) / (y1 - y0 || 1)) * (H - PAD.top - PAD.bottom)
  const yearsOnly = xs.every((x) => new Date(x).getUTCMonth() === 0 && new Date(x).getUTCDate() === 1)
  const fx = (x: number) => (yearsOnly ? formatYear(l, new Date(x).getUTCFullYear()) : formatDate(l, new Date(x).toISOString()))
  const fy = (y: number) => formatNumber(l, y, { maximumFractionDigits: 2 })
  const label = t('dataset.chartLabel', { y: series.y, x: series.x, from: fx(x0), to: fx(x1), min: fy(y0), max: fy(y1) })
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full text-night">
        <g className="fill-slate text-[15px]">
          <text x={PAD.left - 8} y={sy(y1) + 4} textAnchor="end">{fy(y1)}</text>
          <text x={PAD.left - 8} y={sy(y0) + 4} textAnchor="end">{fy(y0)}</text>
          <text x={PAD.left} y={H - 8}>{fx(x0)}</text>
          <text x={W - PAD.right} y={H - 8} textAnchor="end">{fx(x1)}</text>
        </g>
        <path d={`M${PAD.left} ${PAD.top}V${H - PAD.bottom}H${W - PAD.right}`} fill="none" className="stroke-rule" strokeWidth="1" />
        <polyline points={series.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-2 text-sm text-slate">{t('dataset.chart', { y: series.y, x: series.x })}</figcaption>
    </figure>
  )
}
