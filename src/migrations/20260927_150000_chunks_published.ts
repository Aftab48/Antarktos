import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Step 3 (plan §7, §11): public search reads published chunks only, and the pipeline upserts chunks by
// (collection, doc_id, locale, position) so re-processing keeps chunk ids (and citations) stable.
// Plain SQL like 20260927_131000_archive_chunks, no .json snapshot.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "archive_chunks" ADD COLUMN "published" boolean NOT NULL DEFAULT false;
  DROP INDEX "archive_chunks_doc_idx";
  CREATE UNIQUE INDEX "archive_chunks_doc_idx" ON "archive_chunks" ("collection", "doc_id", "locale", "position");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX "archive_chunks_doc_idx";
  CREATE INDEX "archive_chunks_doc_idx" ON "archive_chunks" ("collection", "doc_id");
  ALTER TABLE "archive_chunks" DROP COLUMN "published";`)
}
