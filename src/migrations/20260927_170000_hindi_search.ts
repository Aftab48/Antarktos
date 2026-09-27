import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Hindi chunks use Postgres 18's 'hindi' config (Snowball stemmer) instead of 'simple', so inflected forms
// match (वैज्ञानिकों -> वैज्ञानिक). Day-1 check (g): 'hindi' found more on every inflected query, never fewer.
// Known quirk: it over-stems भारती -> भार. SET EXPRESSION (PG 17+) rewrites the column; the GIN index follows.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "archive_chunks" ALTER COLUMN "tsv" SET EXPRESSION AS (
    to_tsvector(CASE WHEN "locale" = 'hi' THEN 'hindi'::regconfig ELSE 'english'::regconfig END,
                coalesce("heading", '') || ' ' || "text"));`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "archive_chunks" ALTER COLUMN "tsv" SET EXPRESSION AS (
    to_tsvector(CASE WHEN "locale" = 'hi' THEN 'simple'::regconfig ELSE 'english'::regconfig END,
                coalesce("heading", '') || ' ' || "text"));`)
}
