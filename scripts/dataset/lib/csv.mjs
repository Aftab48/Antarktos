// Minimal CSV writer. Stdlib only — no csv package needed for this shape of data.
import { writeFile } from 'node:fs/promises'

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
