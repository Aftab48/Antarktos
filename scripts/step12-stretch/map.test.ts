import assert from 'node:assert/strict'
import test from 'node:test'
import { stationPoints } from '../../src/app/(frontend)/_lib/station-map'

test('map includes only published, finite Mercator coordinates and preserves localization', () => {
  const station = { id: 1, name: { en: 'Maitri', hi: 'मैत्री' }, lat: -70.77, lng: 11.73, _status: 'published' }
  const result = stationPoints([station, { ...station, _status: 'draft' }, { ...station, lat: NaN }, { ...station, lat: -90 }, { ...station, lng: 181 }, { ...station, lat: null }], 'hi')
  assert.deepEqual(result, [{ id: 1, name: 'मैत्री', lang: 'hi', lat: -70.77, lng: 11.73, url: '/hi/stations/1' }])
  assert.equal(stationPoints([{ ...station, name: { en: '<script>text</script>' } }], 'hi')[0].lang, 'en')
})
