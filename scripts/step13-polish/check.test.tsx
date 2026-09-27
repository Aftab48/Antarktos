import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProcessingState } from '../../src/components/admin/ProcessingState'
import { LoginIntroduction, PortalLogo } from '../../src/components/admin/Brand'
import { LoadingState } from '../../src/app/(frontend)/_lib/LoadingState'
import { CitationText } from '../../src/components/outreach/CitationText'

const documentFor = (markup: string) => new JSDOM(markup).window.document

test('saved processing states stay distinct from approval and do not invent live progress', () => {
  const labels = { queued: 'Queued', processing: 'Processing', ready: 'Ready for review', needs_ocr: 'Text layer unavailable', failed: 'Processing failed' }
  for (const [state, label] of Object.entries(labels)) {
    const document = documentFor(renderToStaticMarkup(<ProcessingState value={state} />))
    assert.equal(document.querySelector('.science-status')?.textContent, label)
    assert.ok(document.querySelector('[role="status"]'))
    assert.doesNotMatch(document.body.textContent ?? '', /Extracting|Indexing|Summarizing|[0-9]+%/)
  }
  const pending = renderToStaticMarkup(<ProcessingState value="processing" />)
  assert.match(pending, /last saved state/)
  assert.match(renderToStaticMarkup(<ProcessingState value="ready" />), /before publishing/)
  assert.match(renderToStaticMarkup(<ProcessingState value="unexpected" />), /Not recorded/)
  assert.doesNotMatch(renderToStaticMarkup(<ProcessingState value="ready" compact />), /role="status"/)
})

test('loading states are localized, announced once and keep placeholders decorative', () => {
  for (const locale of ['en', 'hi'] as const) {
    const document = documentFor(renderToStaticMarkup(<LoadingState locale={locale} />))
    assert.equal(document.querySelector('[role="status"]')?.getAttribute('lang'), locale)
    assert.equal(document.querySelectorAll('[aria-hidden="true"] .portal-loading-bar').length, 3)
    if (locale === 'hi') assert.doesNotMatch(document.body.textContent ?? '', /Loading|archive/)
  }
})

test('staff login branding provides a heading and preserves the prototype disclosure', () => {
  const document = documentFor(renderToStaticMarkup(<><PortalLogo /><LoginIntroduction /></>))
  assert.equal(document.querySelectorAll('h1').length, 1)
  assert.match(document.body.textContent ?? '', /Not an official government website/)
  assert.match(document.body.textContent ?? '', /Polar Science Portal/)
})

test('styled citations retain their exact source-page links and Hindi accessible label', () => {
  const document = documentFor(renderToStaticMarkup(<CitationText text="तथ्य [c:12]" locale="hi" sources={[{ id: 12, title: 'Source report', titleLocale: 'en', recordUrl: '/archive/reports/4', pageUrl: 'https://example.org/report.pdf#page=7', page: 7 }]} />))
  const link = document.querySelector<HTMLAnchorElement>('.citation-link')!
  assert.equal(link.href, 'https://example.org/report.pdf#page=7')
  assert.equal(link.lang, 'hi')
  assert.ok(link.getAttribute('aria-label'))
  assert.doesNotMatch(link.getAttribute('aria-label') ?? '', /Source|Page/)
})
