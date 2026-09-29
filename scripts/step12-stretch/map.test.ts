import assert from 'node:assert/strict'
import test from 'node:test'
import { stationPoints } from '../../src/app/(frontend)/_lib/station-map'

test('map includes only published, finite Mercator coordinates and preserves localization', () => {
  const station = { id: 1, name: { en: 'Maitri', hi: 'मैत्री' }, lat: -70.77, lng: 11.73, _status: 'published' }
  const result = stationPoints([station, { ...station, _status: 'draft' }, { ...station, lat: NaN }, { ...station, lat: -90 }, { ...station, lng: 181 }, { ...station, lat: null }], 'hi')
  assert.deepEqual(result, [{ id: 1, name: 'मैत्री', lang: 'hi', lat: -70.77, lng: 11.73, url: '/hi/stations/1', historical: false }])
  assert.equal(stationPoints([{ ...station, name: { en: '<script>text</script>' } }], 'hi')[0].lang, 'en')
})

test('historical stations are flagged, so the map draws them behind on a stem', () => {
  const dg = { id: 2, name: { en: 'Dakshin Gangotri' }, lat: -70.07, lng: 12, _status: 'published', operational_status: 'historical' }
  assert.equal(stationPoints([dg], 'en')[0].historical, true)
  assert.equal(stationPoints([{ ...dg, operational_status: 'active' }], 'en')[0].historical, false)
})
