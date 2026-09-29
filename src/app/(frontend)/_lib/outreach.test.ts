import assert from 'node:assert/strict'
import test from 'node:test'
import { postTitle } from './outreach'

test('an untitled (pre-v1.2) post is named "<Platform> post · <source record>" in the page language', () => {
  const source = { value: { title: { en: '14th Indian Arctic Expedition 2023–24' } } }
  assert.equal(postTitle({ platform: 'x', title: 'Team logs sea ice [c:1]', source }, 'en'), 'Team logs sea ice')
  assert.equal(postTitle({ platform: 'x', title: '', source }, 'en'), 'X post · 14th Indian Arctic Expedition 2023–24')
  assert.equal(postTitle({ platform: 'blog', title: null, source }, 'hi'), 'ब्लॉग पोस्ट · 14th Indian Arctic Expedition 2023–24')
  assert.equal(postTitle({ platform: 'instagram', title: '', source: { value: { name: { en: 'Maitri', hi: 'मैत्री' } } } }, 'hi'), 'Instagram पोस्ट · मैत्री')
  // An unpublished source stays a bare id after population.
  assert.equal(postTitle({ platform: 'linkedin', title: '', source: { value: 7 } }, 'en'), 'LinkedIn post')
})
