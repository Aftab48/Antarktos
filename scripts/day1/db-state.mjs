// Day-1 check (a): read-only look at the Neon database over the pooled and the direct host.
// Run: node --env-file=.env scripts/day1/db-state.mjs
import pg from 'pg'

const pooled = process.env.DATABASE_URL
const direct = pooled.replace('-pooler.', '.') // Neon: direct host = pooled host without "-pooler"

for (const [name, url] of [['pooled', pooled], ['direct', direct]]) {
  const client = new pg.Client({ connectionString: url })
  const t0 = Date.now()
  await client.connect()
  const connectMs = Date.now() - t0
  const { rows: [info] } = await client.query(
    `select current_setting('server_version') as version, (select datctype from pg_database where datname = current_database()) as lc_ctype,
            pg_size_pretty(pg_database_size(current_database())) as db_size, inet_server_addr() as addr`)
  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables where table_schema = 'public' order by 1`)
  let migrations = []
  if (tables.some((t) => t.table_name === 'payload_migrations')) {
    migrations = (await client.query('select name, batch, created_at from payload_migrations order by id')).rows
  }
  let users = null
  if (tables.some((t) => t.table_name === 'users')) users = (await client.query('select count(*)::int as n from users')).rows[0].n
  console.log(JSON.stringify({ name, pooler: new URL(url).host.includes('-pooler.'), connectMs, ...info, tables: tables.map((t) => t.table_name), migrations, users }, null, 2))
  await client.end()
}
