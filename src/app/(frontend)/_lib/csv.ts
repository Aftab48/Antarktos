// Dataset preview (plan §17 stretch 3): the first rows of a CSV/TSV and, when the columns allow it, one line chart.
// Only the head of the file is fetched, so the parser drops a last line that may have been cut mid-row.

export type Table = { header: string[]; rows: string[][] }

// RFC 4180-style: quoted fields, doubled quotes, CRLF or LF. `truncated` drops the last (possibly partial) record.
export function parseDelimited(text: string, delimiter: string, truncated: boolean, maxRows = 50): Table | null {
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let quoted = false
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0
  for (; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"' && field === '') quoted = true
    else if (c === delimiter) record.push(field), (field = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      record.push(field), records.push(record), (field = ''), (record = [])
      if (records.length > maxRows + 1) break
    } else field += c
  }
  if (!truncated && (field !== '' || record.length)) record.push(field), records.push(record)
  const [header, ...rows] = records.filter((r) => r.some((v) => v.trim() !== ''))
  if (!header || header.length < 2) return null
  return { header: header.map((h) => h.trim()), rows: rows.slice(0, maxRows) }
}

const num = (v: string) => (/^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(v) ? Number(v) : NaN)
// A year (1900–2100) or an ISO date/date-time.
const time = (v: string) => {
  const s = v.trim()
  if (/^\d{4}$/.test(s) && +s >= 1900 && +s <= 2100) return Date.UTC(+s, 0, 1)
  return /^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?$/.test(s) ? Date.parse(s.length === 10 ? `${s}T00:00:00Z` : s) : NaN
}

export type Series = { x: string; y: string; points: [number, number][] }

// The first time-like column against the first numeric column, when at least 3 rows have both.
export function lineSeries({ header, rows }: Table): Series | null {
  // Every non-blank value in the column parses (blank cells are gaps); an all-blank column doesn't count.
  const every = (col: number, f: (v: string) => number) => rows.some((r) => r[col]?.trim()) && rows.every((r) => !r[col]?.trim() || !Number.isNaN(f(r[col])))
  const xi = header.findIndex((_, c) => every(c, time))
  if (xi < 0) return null
  const yi = header.findIndex((_, c) => c !== xi && every(c, num))
  if (yi < 0) return null
  const points = rows
    .map((r): [number, number] => [time(r[xi] ?? ''), num(r[yi] ?? '')])
    .filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y))
    .sort((a, b) => a[0] - b[0])
  return points.length >= 3 ? { x: header[xi], y: header[yi], points } : null
}
