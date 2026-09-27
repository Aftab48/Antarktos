import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { Answer } from '../../src/app/(frontend)/[lang]/ask/Answer'
import { AskForm } from '../../src/app/(frontend)/[lang]/ask/AskForm'
import type { AskAnswer } from '../../src/search/types'

test('answer escapes archive text and links only citations with source cards', () => {
  const answer: AskAnswer = {
    status: 'answered', locale: 'hi', answer: '', cached: false, suggestedSearches: [],
    sentences: ['भारती <script>alert(1)</script> [c:42] [c:999]'],
    sources: [{ chunkId: '42', collection: 'reports', docId: '2', title: 'English report', titleLocale: 'en', page: 3, url: '/hi/archive/reports/2' }],
  }
  const html = renderToStaticMarkup(<Answer answer={answer} locale="hi" />)
  assert.ok(html.includes('href="#source-42"'))
  assert.ok(html.includes('id="source-42"'))
  assert.ok(html.includes('href="/hi/archive/reports/2" lang="en"'))
  assert.ok(html.includes('lang="hi"'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('999'))
  assert.ok(!html.includes('[c:'))
})

test('refusal offers encoded searches in the current page language without sources', () => {
  const html = renderToStaticMarkup(<Answer locale="hi" answer={{ status: 'not_found', locale: 'en', answer: 'Not found in the archive', sentences: [], sources: [], suggestedSearches: ['ice & ocean'], cached: false }} />)
  assert.ok(html.includes('href="/hi/archive?q=ice+%26+ocean"'))
  assert.ok(html.includes('lang="en"'))
  assert.ok(!html.includes('id="source-'))
})

test('bilingual forms associate their label, hint and cap with the question', () => {
  for (const locale of ['en', 'hi'] as const) {
    const html = renderToStaticMarkup(<AskForm locale={locale} />)
    assert.ok(html.includes('for="archive-question"'))
    assert.ok(html.includes('aria-describedby="question-hint question-length"'))
    assert.ok(html.includes('maxLength="300"'))
    assert.ok(html.includes('role="status"'))
    assert.ok(/<button[^>]*disabled=""/u.test(html))
  }
})
