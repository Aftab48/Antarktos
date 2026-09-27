import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_outreach_posts_topic" AS ENUM('ice', 'climate', 'oceans', 'life_in_antarctica', 'stations', 'expeditions');
  CREATE TYPE "public"."enum__outreach_posts_v_version_topic" AS ENUM('ice', 'climate', 'oceans', 'life_in_antarctica', 'stations', 'expeditions');
  ALTER TABLE "outreach_posts" ADD COLUMN "dateline" varchar;
  ALTER TABLE "outreach_posts" ADD COLUMN "about" varchar;
  ALTER TABLE "outreach_posts" ADD COLUMN "topic" "enum_outreach_posts_topic";
  ALTER TABLE "outreach_posts" ADD COLUMN "generation_request_id" varchar;
  ALTER TABLE "_outreach_posts_v" ADD COLUMN "version_dateline" varchar;
  ALTER TABLE "_outreach_posts_v" ADD COLUMN "version_about" varchar;
  ALTER TABLE "_outreach_posts_v" ADD COLUMN "version_topic" "enum__outreach_posts_v_version_topic";
  ALTER TABLE "_outreach_posts_v" ADD COLUMN "version_generation_request_id" varchar;
  CREATE INDEX "outreach_posts_generation_request_id_idx" ON "outreach_posts" USING btree ("generation_request_id");
  CREATE INDEX "_outreach_posts_v_version_version_generation_request_id_idx" ON "_outreach_posts_v" USING btree ("version_generation_request_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "outreach_posts_generation_request_id_idx";
  DROP INDEX "_outreach_posts_v_version_version_generation_request_id_idx";
  ALTER TABLE "outreach_posts" DROP COLUMN "dateline";
  ALTER TABLE "outreach_posts" DROP COLUMN "about";
  ALTER TABLE "outreach_posts" DROP COLUMN "topic";
  ALTER TABLE "outreach_posts" DROP COLUMN "generation_request_id";
  ALTER TABLE "_outreach_posts_v" DROP COLUMN "version_dateline";
  ALTER TABLE "_outreach_posts_v" DROP COLUMN "version_about";
  ALTER TABLE "_outreach_posts_v" DROP COLUMN "version_topic";
  ALTER TABLE "_outreach_posts_v" DROP COLUMN "version_generation_request_id";
  DROP TYPE "public"."enum_outreach_posts_topic";
  DROP TYPE "public"."enum__outreach_posts_v_version_topic";`)
}
