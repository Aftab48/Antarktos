import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Plain SQL tables outside Payload's schema (plan §11, §12, §16). No .json snapshot on purpose:
// Payload doesn't know these tables, so later generated migrations leave them alone.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "archive_chunks" (
    "id" bigserial PRIMARY KEY,
    "collection" text NOT NULL,
    "doc_id" text NOT NULL,
    "locale" text NOT NULL CHECK ("locale" IN ('en', 'hi')),
    "position" int NOT NULL,
    "page" int,
    "heading" text,
    "text" text NOT NULL,
    "tsv" tsvector GENERATED ALWAYS AS (
      to_tsvector(CASE WHEN "locale" = 'hi' THEN 'simple'::regconfig ELSE 'english'::regconfig END,
                  coalesce("heading", '') || ' ' || "text")) STORED
  );
  CREATE INDEX "archive_chunks_tsv_idx" ON "archive_chunks" USING gin ("tsv");
  CREATE INDEX "archive_chunks_doc_idx" ON "archive_chunks" ("collection", "doc_id");

  CREATE TABLE "ask_log" (
    "id" bigserial PRIMARY KEY,
    "ip_hash" text NOT NULL,
    "question" text NOT NULL,
    "answer" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX "ask_log_ip_idx" ON "ask_log" ("ip_hash", "created_at");
  CREATE INDEX "ask_log_question_idx" ON "ask_log" ("question", "created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "ask_log";
  DROP TABLE "archive_chunks";`)
}
