import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Quiz } from '../../src/app/(frontend)/[lang]/learn/Quiz'
import { translator } from '../../src/i18n'

test('English and Hindi browser quizzes select, reveal a cited explanation, and reset without storing answers', async () => {
  const dom = new JSDOM('<!doctype html><html><body><main></main></body></html>', { url: 'https://example.test/learn/1' })
  const previous = { window: globalThis.window, document: globalThis.document, HTMLElement: globalThis.HTMLElement }
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.querySelector('main')!
  const root = createRoot(container)
  try {
    for (const l of ['en', 'hi'] as const) {
      const t = translator(l)
      const text = l === 'en' ? 'Question' : 'प्रश्न'
      const explanation = l === 'en' ? 'The source supports option C.' : 'स्रोत में विकल्प ग का समर्थन है।'
      const options = l === 'en' ? ['A', 'B', 'C', 'D'] : ['क', 'ख', 'ग', 'घ']
      const items = Array.from({ length: 5 }, (_, i) => ({ question: `${text} ${i + 1}`, options, answer_index: 2, explanation, chunk_id: 1 }))
      const sources = [{ id: 1, title: l === 'en' ? 'Test source' : 'परीक्षण स्रोत', page: 2, recordUrl: '/archive/reports/7', pageUrl: 'https://example.test/source.pdf#page=2' }]
      await act(async () => root.render(<Quiz key={l} items={items} sources={sources} l={l} contentLocale={l} />))
      assert.equal(container.querySelectorAll('fieldset').length, 5)
      assert.equal(container.querySelectorAll('input[type="radio"]').length, 20)
      const buttons = Array.from(container.querySelectorAll('button'))
      assert.equal(buttons[0].disabled, true)
      const status = container.querySelector('[role="status"]')!
      assert.ok(status, 'feedback live region exists before its content changes')
      assert.equal(status.textContent, '')
      await act(async () => (container.querySelectorAll('input')[2] as HTMLInputElement).click())
      assert.equal((container.querySelector('button') as HTMLButtonElement).disabled, false)
      await act(async () => (container.querySelector('button') as HTMLButtonElement).click())
      const result = container.querySelector('[role="status"]')!
      assert.ok(result === status, 'checking updates the existing live region')
      assert.ok(result.textContent?.includes(t('learn.correct')))
      assert.ok(result.textContent?.includes(explanation))
      assert.equal(result.querySelector('a')?.getAttribute('href'), 'https://example.test/source.pdf#page=2')
      assert.ok((container.querySelector('input') as HTMLInputElement).disabled)
      const reset = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === t('learn.resetQuiz'))!
      await act(async () => reset.click())
      assert.equal(container.querySelectorAll('input:checked').length, 0)
      assert.ok(container.querySelector('[role="status"]') === status, 'reset preserves the live region')
      assert.equal(status.textContent, '')
      await act(async () => (container.querySelector('input') as HTMLInputElement).click())
      await act(async () => (container.querySelector('button') as HTMLButtonElement).click())
      assert.ok(container.querySelector('[role="status"]')?.textContent?.includes(t('learn.tryAgain')))
      assert.ok(container.querySelector('[role="status"]')?.textContent?.includes(`${t('learn.correctAnswer')} ${options[2]}`))
      assert.equal(dom.window.localStorage.length, 0)
      assert.equal(dom.window.sessionStorage.length, 0)
      await act(async () => root.render(<Quiz items={items.slice(0, 4)} sources={sources} l={l} contentLocale={l} />))
      assert.ok(container.textContent?.includes(t('learn.quizUnavailable')))
      assert.equal(container.querySelectorAll('input').length, 0)
    }
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previous)
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT
    dom.window.close()
  }
})
