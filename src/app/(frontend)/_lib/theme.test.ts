// Both public palettes keep WCAG AA contrast (1.4.3 text, 1.4.11 controls and focus ring).
// Run: node --import tsx --test "src/app/(frontend)/_lib/theme.test.ts"
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const block = (selector: string) => {
  const at = css.indexOf(selector)
  assert.ok(at >= 0, `styles.css has no "${selector}" block`)
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at))
  return Object.fromEntries([...body.matchAll(/--(\w+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]))
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const light = block(':root, .dark :is(header')
const themes = { light, dark: { ...light, ...block('\n.dark {') } }

for (const [name, p] of Object.entries(themes)) {
  test(`${name} palette meets AA on page and panel backgrounds`, () => {
    for (const bg of ['snow', 'ice']) {
      for (const fg of ['night', 'slate', 'alert']) assert.ok(ratio(p[fg], p[bg]) >= 4.5, `${name}: ${fg} on ${bg} is ${ratio(p[fg], p[bg]).toFixed(2)}`)
      for (const ui of ['control', 'signal', 'line']) assert.ok(ratio(p[ui], p[bg]) >= 3, `${name}: ${ui} on ${bg} is ${ratio(p[ui], p[bg]).toFixed(2)}`)
    }
    // Primary buttons: snow text on night, and on deep when hovered.
    for (const bg of ['night', 'deep']) assert.ok(ratio(p.snow, p[bg]) >= 4.5, `${name}: snow on ${bg} is ${ratio(p.snow, p[bg]).toFixed(2)}`)
  })
}
