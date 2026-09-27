// Creates the admin, editor and reviewer test accounts if they don't exist, with generated
// passwords written to data/test-users.json (gitignored, never printed).
// Run: npx payload run scripts/step2/test-users.ts
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '@payload-config'

const FILE = 'data/test-users.json'
const payload = await getPayload({ config })
const saved: Record<string, { email: string; password: string }> = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : {}

// Admin first: the first account is always an admin (Users hook).
for (const role of ['admin', 'editor', 'reviewer'] as const) {
  const email = `${role}@sih63.test`
  const { totalDocs } = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (totalDocs) {
    if (!saved[role]) throw new Error(`${email} exists but has no password in ${FILE}; reset it in the admin panel.`)
    continue
  }
  const password = randomBytes(15).toString('base64url')
  await payload.create({ collection: 'users', data: { email, password, name: `Test ${role}`, role } })
  saved[role] = { email, password }
  writeFileSync(FILE, JSON.stringify(saved, null, 2) + '\n')
  console.log(`created ${email} (${role})`)
}
console.log(`Test users: ${Object.values(saved).map((u) => u.email).join(', ')}. Passwords: ${FILE}`)
