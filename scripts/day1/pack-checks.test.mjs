// Run: node --test scripts/day1/pack-checks.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { numbersIn, sentences, citedIds, scriptShare } from './pack-checks.mjs'

test('numbers: Devanagari digits, separators, markers ignored', () => {
  assert.deepEqual(numbersIn('२०२३ में 1,500 फोटो [c:101]'), ['2023', '1500'])
  assert.deepEqual(numbersIn('the 14th expedition, 2023-24'), ['14', '2023', '2024'])
})

test('sentences: split on . and ।, keep trailing markers, skip headings and abbreviations', () => {
  const s = sentences('## Heading\nIt began in 2007 [c:1]. Dr. M. Ravichandran spoke. [c:2]\nहिमाद्रि स्टेशन है। [c:3] दूसरा वाक्य। सचिव डॉ. एम. रविचंद्रन आए। [c:4]')
  assert.deepEqual(s, ['It began in 2007 [c:1].', 'Dr. M. Ravichandran spoke. [c:2]', 'हिमाद्रि स्टेशन है। [c:3]', 'दूसरा वाक्य।', 'सचिव डॉ. एम. रविचंद्रन आए। [c:4]'])
  assert.deepEqual(citedIds(s[0] + s[1]), [1, 2])
})

test('script share', () => {
  assert.equal(scriptShare('हिमाद्रि [c:1]'), 1)
  assert.equal(scriptShare('Himadri'), 0)
})
