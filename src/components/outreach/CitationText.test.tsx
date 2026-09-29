import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { CitationText, withCitation } from './CitationText'

const sources = [{ id: 7, title: 'Report', recordUrl: '/archive/reports/1', pageUrl: '/r.pdf#page=3', page: 3 }] as any
const html = (text: string) => renderToStaticMarkup(<CitationText text={text} sources={sources} locale="en" />)

test('heading followed by a single newline is a heading, the rest a paragraph', () => {
  const out = html('## Overview\nThe station opened. [c:7]')
  assert.match(out, /<h3>Overview<\/h3><p[^>]*>The station opened\. <sup><a class="citation-link" href="\/r\.pdf#page=3"/)
  assert.doesNotMatch(out, /##/)
})

test('heading followed by a blank line', () => {
  assert.match(html('## Overview\n\nText here.'), /<h3>Overview<\/h3><p[^>]*>Text here\.<\/p>/)
})

test('several headings, with and without blank lines, keep their order', () => {
  const out = html('Intro line.\n## Methods\nWe sampled. [c:7]\nMore detail.\n\n## Limitations\nFew sites.\n### Conclusion [c:7]\nDone.')
  const tags = [...out.matchAll(/<(h3|p)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => `${m[1]}:${m[2].replace(/<[^>]+>/g, '')}`)
  assert.deepEqual(tags, ['p:Intro line.', 'h3:Methods', 'p:We sampled. [1]\nMore detail.', 'h3:Limitations', 'p:Few sites.', 'h3:Conclusion [1]', 'p:Done.'])
})

test('a "#" mid-sentence or a hashtag is not a heading', () => {
  const out = html('Station #3 was busy.\n#Antarctica #NCPOR')
  assert.doesNotMatch(out, /<h3>/)
  assert.match(out, /Station #3 was busy\.\n#Antarctica #NCPOR/)
})

test('unknown citation ids render nothing', () => {
  assert.equal(html('Fact. [c:99]'), '<div lang="en"><p style="white-space:pre-line">Fact. </p></div>')
})

test('withCitation adds the chunk marker only when it is missing', () => {
  assert.equal(withCitation('It is cold. [c:7]', 7), 'It is cold. [c:7]')
  assert.equal(withCitation('It is cold.', 7), 'It is cold. [c:7]')
  assert.equal(withCitation('Cold [c:70].', 7), 'Cold [c:70]. [c:7]')
})
