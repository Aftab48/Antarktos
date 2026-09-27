// Read-only SSR semantics scan. jsdom cannot verify visual contrast or real assistive technology.
// node scripts/step11-accessibility/scan.mjs (reuse npm run dev on port 3000)
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8')
const results = []
for (const locale of ['', '/hi']) {
  for (const path of ['/', '/expeditions', '/stations', '/archive', '/ask', '/news', '/learn']) {
    const route = `${locale}${path}`
    const response = await fetch(`http://localhost:3000${route}`)
    assert.equal(response.status, 200, route)
    const dom = new JSDOM(await response.text(), { url: `http://localhost:3000${route}`, runScripts: 'outside-only' })
    dom.window.eval(axeSource)
    const result = await dom.window.axe.run(dom.window.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, rules: { 'color-contrast': { enabled: false } } })
    results.push({ route, violations: result.violations, incomplete: result.incomplete, passedRules: result.passes.map((r) => r.id) })
    console.log(`${route}: ${result.violations.length} semantic violations; ${result.incomplete.length} incomplete checks`)
    dom.window.close()
  }
}
await mkdir('artifacts/step11-accessibility', { recursive: true })
await writeFile('artifacts/step11-accessibility/axe-ssr.json', JSON.stringify({ tool: 'axe-core in jsdom (SSR only; color contrast disabled)', results }, null, 2))
assert.equal(results.reduce((n, r) => n + r.violations.length, 0), 0, 'Review artifacts/step11-accessibility/axe-ssr.json')
