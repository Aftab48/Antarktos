// Lists records the pipeline didn't finish (plan §7, §15): queued or processing for over 10 minutes
// (the function died mid-job, or the record was saved without a request, e.g. by a script), or failed.
// Run: npm run pipeline:stuck
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'
import { STATEFUL } from '../../src/pipeline'

const payload = await getPayload({ config })
const query = STATEFUL.map(
  (c) => `select '${c}' as collection, id, processing_state::text as state, processing_error as error, updated_at from ${c}
    where (processing_state in ('queued', 'processing') and updated_at < now() - interval '10 minutes') or processing_state = 'failed'`,
).join(' union all ')
const { rows } = await payload.db.drizzle.execute(sql.raw(`${query} order by updated_at`))

if (!rows.length) console.log('No stuck records.')
for (const r of rows) {
  console.log(`${r.collection}/${r.id}  ${r.state}  since ${new Date(r.updated_at as string).toISOString()}${r.error ? `  ${r.error}` : ''}`)
  console.log(`  npm run pipeline:process -- --collection ${r.collection} --id ${r.id}`)
}
