import assert from 'node:assert/strict'
import test from 'node:test'

import { Media, r2Thumbnail } from './Media'

test('admin thumbnails load from R2, never the /api/media/file proxy', () => {
  // A size name here ('thumbnail') makes Payload build a proxy URL when serverURL is empty.
  assert.equal(typeof Media.upload === 'object' && Media.upload.adminThumbnail, r2Thumbnail)
  process.env.R2_PUBLIC_URL = 'https://files.example'
  const sizes = { thumbnail: { filename: 'Maitri station-400x267.webp' } }
  assert.equal(r2Thumbnail({ doc: { filename: 'Maitri station.jpg', mimeType: 'image/jpeg', sizes } }), 'https://files.example/Maitri%20station-400x267.webp')
  // A client upload stores the object under its _objectKey folder.
  assert.equal(r2Thumbnail({ doc: { filename: 'a.jpg', mimeType: 'image/jpeg', _objectKey: 'k1', sizes: { thumbnail: { filename: 'a-400x300.webp' } } } }), 'https://files.example/k1/a-400x300.webp')
  // An image too small for a resize falls back to the original; a video or YouTube-only record gets Payload's file icon.
  assert.equal(r2Thumbnail({ doc: { filename: 'tiny.png', mimeType: 'image/png', sizes: { thumbnail: { filename: null } } } }), 'https://files.example/tiny.png')
  assert.equal(r2Thumbnail({ doc: { filename: 'clip.mp4', mimeType: 'video/mp4', sizes: { thumbnail: { filename: null } } } }), null)
  assert.equal(r2Thumbnail({ doc: { youtube_url: 'https://youtu.be/x' } }), null)
})
