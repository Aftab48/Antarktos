// Minimal CSV writer. Stdlib only — no csv package needed for this shape of data.
import { appendFile, writeFile } from 'node:fs/promises'

function esc(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','))
  }
  await writeFile(filePath, lines.join('\n') + '\n', 'utf8')
}

// Appends rows to an existing CSV that already has this header.
export async function appendCsv(filePath, headers, rows) {
  if (rows.length) await appendFile(filePath, rows.map((row) => headers.map((h) => esc(row[h])).join(',')).join('\n') + '\n', 'utf8')
}
