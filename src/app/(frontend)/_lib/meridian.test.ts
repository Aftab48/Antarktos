// node --import tsx --test "src/app/(frontend)/_lib/meridian.test.ts"
import assert from 'node:assert/strict'
import test from 'node:test'
import { latY, spreadLabels } from './meridian'

test('latY maps poles and equator onto the figure height', () => {
  assert.equal(latY(90, 32), 0)
  assert.equal(latY(-90, 32), 32)
  assert.equal(latY(0, 32), 16)
})

test('spreadLabels separates the clustered Antarctic stations inside the figure', () => {
  const ys = [-69.41, -70.08, -70.77].map((lat) => latY(lat, 32))
  const out = spreadLabels(ys, 3, 32)
  for (let i = 1; i < out.length; i++) assert.ok(out[i] - out[i - 1] >= 3 - 1e-9, `gap ${i}`)
  for (const y of out) assert.ok(y >= 1.5 && y <= 30.5, `${y} inside`)
  assert.deepEqual(out.map((y) => Math.round(y * 10) / 10), [24.5, 27.5, 30.5])
})

test('a lone label keeps its y and an empty list stays empty', () => {
  assert.deepEqual(spreadLabels([10.24], 3, 32), [10.24])
  assert.deepEqual(spreadLabels([], 3, 32), [])
})
