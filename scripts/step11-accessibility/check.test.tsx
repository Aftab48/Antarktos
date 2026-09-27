import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { Quiz } from '../../src/app/(frontend)/[lang]/learn/Quiz'

test('informative photo uses its real caption when alt is absent and preserves fallback language', async () => {
  const { MediaImage } = await import('../../src/app/(frontend)/_lib/ui')
  const markup = renderToStaticMarkup(<MediaImage m={{ url: 'https://example.org/photo.jpg', mimeType: 'image/jpeg', caption: { en: 'Bharati station in snow [c:42]', hi: '' } }} l="hi" sizes="100vw" />)
  const dom = new JSDOM(markup)
  assert.equal(dom.window.document.querySelector('img')?.alt, 'Bharati station in snow')
  assert.equal(dom.window.document.querySelector('img')?.lang, 'en')
  dom.window.close()
})

test('quiz checking retains focus and exposes feedback without restarting keyboard navigation', async () => {
  const dom = new JSDOM('<!doctype html><html lang="en"><title>Quiz fixture</title><body><main><h1>Learning fixture</h1><div id="root"></div></main></body></html>', { url: 'http://localhost', runScripts: 'outside-only' })
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  const root = createRoot(dom.window.document.getElementById('root')!)
  const items = Array.from({ length: 5 }, (_, i) => ({ question: `Question ${i + 1}`, options: ['First', 'Second', 'Third', 'Fourth'], answer_index: 0, explanation: 'Source explanation.', chunk_id: 1 }))
  try {
    await act(async () => root.render(<Quiz items={items} sources={[]} l="en" contentLocale="en" />))
    const radio = dom.window.document.querySelector<HTMLInputElement>('input')!
    await act(async () => radio.click())
    const check = dom.window.document.querySelector<HTMLButtonElement>('button')!
    check.focus()
    await act(async () => check.click())
    assert.notEqual(dom.window.document.activeElement, dom.window.document.body, 'focus must not fall back to the document body')
    assert.equal(dom.window.document.activeElement, check, 'the Check answer control stays focused')
    assert.equal(check.getAttribute('aria-disabled'), 'true')
    assert.match(dom.window.document.querySelector('[role="status"]')?.textContent ?? '', /Correct/)
    const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
    dom.window.eval(axeSource)
    const result = await (dom.window as any).axe.run(dom.window.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, rules: { 'color-contrast': { enabled: false } } })
    assert.equal(result.violations.length, 0, JSON.stringify(result.violations.map((v: any) => ({ id: v.id, targets: v.nodes.map((n: any) => n.target) }))))
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
