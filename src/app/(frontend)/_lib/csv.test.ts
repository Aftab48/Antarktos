// node --import tsx --test "src/app/(frontend)/_lib/csv.test.ts"
import assert from 'node:assert/strict'
import test from 'node:test'
import { lineSeries, parseDelimited } from './csv'

test('parses quoted fields, doubled quotes, CRLF and a BOM', () => {
  const t = parseDelimited('﻿site,note\r\n"Maitri, Schirmacher","said ""cold"""\r\nBharati,\r\n', ',', false)
  assert.deepEqual(t, { header: ['site', 'note'], rows: [['Maitri, Schirmacher', 'said "cold"'], ['Bharati', '']] })
})

test('a truncated head drops the cut-off last line; a complete file keeps it', () => {
  assert.deepEqual(parseDelimited('a,b\n1,2\n3,4', ',', true)?.rows, [['1', '2']])
  assert.deepEqual(parseDelimited('a,b\n1,2\n3,4', ',', false)?.rows, [['1', '2'], ['3', '4']])
})

test('keeps at most maxRows rows, reads TSV, rejects single-column text', () => {
  const body = Array.from({ length: 80 }, (_, i) => `${i}\t${i * 2}`).join('\n')
  assert.equal(parseDelimited(`x\ty\n${body}\n`, '\t', false)?.rows.length, 50)
  assert.equal(parseDelimited('just one column\nvalue\n', ',', false), null)
})

test('lineSeries plots the first date column against the first numeric column', () => {
  const t = parseDelimited('station,date,temp_c\nMaitri,2024-01-03,-2.5\nMaitri,2024-01-01,-4\nMaitri,2024-01-02,\nMaitri,2024-01-04,1e0\n', ',', false)!
  const s = lineSeries(t)!
  assert.equal(s.x, 'date')
  assert.equal(s.y, 'temp_c')
  assert.deepEqual(s.points.map(([, y]) => y), [-4, -2.5, 1]) // sorted by date, blank value skipped
})

test('no chart without a time column or with fewer than 3 points', () => {
  assert.equal(lineSeries(parseDelimited('name,value\na,1\nb,2\nc,3\n', ',', false)!), null)
  assert.equal(lineSeries(parseDelimited('year,value\n2020,1\n2021,2\n', ',', false)!), null)
})
