// Offline regression using Payload's installed field-read processor; no database/provider calls.
// Run: node --import tsx --test scripts/step9/check.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { promise as readField } from '../../node_modules/payload/dist/fields/hooks/afterRead/promise.js'
import { OutreachPosts } from '../../src/collections/OutreachPosts.ts'

test('Payload hides rejected AI prose from anonymous reads and keeps it available to staff', async () => {
  const field = OutreachPosts.fields.find(f => f.name === 'check_issues')
  for (const role of [null, 'viewer', 'editor', 'reviewer', 'admin']) {
    const issues = ['Dropped uncited sentence: UNSUPPORTED_AUDIT_CLAIM.']
    const doc = { check_issues: issues }
    await readField({ field, doc, siblingDoc: doc, siblingFields: [field], fieldIndex: 0, fieldDepth: 0,
      parentIndexPath: '', parentPath: '', parentSchemaPath: '',
      req: { user: role ? { role } : null, payload: { config: {} } }, overrideAccess: false,
      fieldPromises: [], populationPromises: [], depth: 0, currentDepth: 0, context: {}, locale: 'en', flattenLocales: true })
    assert.deepEqual(doc.check_issues, ['editor', 'reviewer', 'admin'].includes(role) ? issues : undefined)
  }
})
