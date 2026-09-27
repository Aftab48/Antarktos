import test from 'node:test'
import assert from 'node:assert/strict'
import { citationParts, copyText, linkedInIntent, r2ObjectKey, sourceRecordPath, validQuiz, xIntent } from './presentation'

test('social copy keeps validated body and hashtags without editorial title or duplicate first thread item', () => {
  assert.equal(copyText({ platform: 'instagram', title: 'Editorial title', body: 'Caption [c:12]', hashtags: ['#Science'] }), 'Caption\n\n#Science')
  assert.equal(copyText({ platform: 'x', body: 'First.', thread: [{ text: 'First.' }, { text: 'Second.' }, { text: 'Third.' }] }), 'First.\n\nSecond.\n\nThird.')
  assert.equal(copyText({ platform: 'press_note', title: 'Headline', dateline: 'Goa', body: 'Body [c:8]', about: 'About.' }), 'Headline\n\nGoa\n\nBody\n\nAbout.')
})
test('share URLs encode text and only pass the public URL to LinkedIn', () => {
  assert.equal(new URL(xIntent('ध्रुवीय विज्ञान & ice?')).searchParams.get('text'), 'ध्रुवीय विज्ञान & ice?')
  const li = new URL(linkedInIntent('https://example.org/hi/news/12'))
  assert.equal(li.searchParams.get('url'), 'https://example.org/hi/news/12')
  assert.deepEqual([...li.searchParams.keys()], ['url'])
})
test('R2 download keys only come from the configured public origin and base path', () => {
  assert.equal(r2ObjectKey('https://assets.example.org/files/uuid/Polar%20ice.jpg', 'https://assets.example.org/files'), 'uuid/Polar ice.jpg')
  for (const url of ['https://evil.example.org/files/a.jpg', 'https://assets.example.org/other/a.jpg', 'https://assets.example.org/files/%2e%2e%2fsecret', 'https://assets.example.org/files/a%5cb.jpg']) assert.equal(r2ObjectKey(url, 'https://assets.example.org/files'), null)
})
test('citations resolve exact integer markers and source paths for all record groups', () => {
  assert.deepEqual(citationParts('Ice. [c:12]'), [{ text: 'Ice. ' }, { id: 12 }, { text: '' }])
  assert.equal(sourceRecordPath('reports', 7), '/archive/reports/7')
  assert.equal(sourceRecordPath('stations', 1), '/stations/1')
  assert.equal(sourceRecordPath('expeditions', 2), '/expeditions/2')
})
test('browser quiz only exposes structurally usable, cited questions', () => {
  const question = { question: 'Where?', options: ['A', 'B', 'C', 'D'], answer_index: 2, explanation: 'The source says C.', chunk_id: 12 }
  assert.equal(validQuiz([question]).length, 1)
  for (const bad of [{ ...question, answer_index: 4 }, { ...question, options: ['A'] }, { ...question, chunk_id: null }, { ...question, explanation: '' }]) assert.equal(validQuiz([bad]).length, 0)
})
