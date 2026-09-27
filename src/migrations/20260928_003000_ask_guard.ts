import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE ask_log ADD COLUMN cache_key text, ADD COLUMN fingerprint text,
      ADD COLUMN raw_response jsonb, ADD COLUMN model text, ADD COLUMN prompt_version text,
      ADD COLUMN checks jsonb;
    CREATE INDEX ask_log_cache_idx ON ask_log(cache_key,created_at DESC) WHERE answer IS NOT NULL;
  `)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX ask_log_cache_idx;
    ALTER TABLE ask_log DROP COLUMN cache_key, DROP COLUMN fingerprint,
      DROP COLUMN raw_response, DROP COLUMN model, DROP COLUMN prompt_version, DROP COLUMN checks;
  `)
}
