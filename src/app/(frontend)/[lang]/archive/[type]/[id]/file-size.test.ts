// node --import tsx "src/app/(frontend)/[lang]/archive/[type]/[id]/file-size.test.ts"  (no --test: it would read the brackets as a glob)
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileSize } from './file-size'

test('small files show whole kB, never 0 MB', () => {
  assert.equal(fileSize('en', 11_455), '11 kB')
  assert.equal(fileSize('en', 300), '1 kB')
  assert.equal(fileSize('en', 123_456), '123 kB')
})

test('1 MB and up show MB to one decimal, with Indian digit grouping', () => {
  assert.equal(fileSize('en', 999_600), '1 MB')
  assert.equal(fileSize('en', 12_345_678), '12.3 MB')
  assert.equal(fileSize('en', 1_234_567_890), '1,234.6 MB')
  assert.equal(fileSize('hi', 12_345_678), new Intl.NumberFormat('hi-IN', { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }).format(12.3))
})

test('no size, no fact', () => {
  assert.equal(fileSize('en', undefined), undefined)
  assert.equal(fileSize('en', 0), undefined)
})
