import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Provider envelopes and exact bounded evidence are durable, private audit data.
// This plain SQL table has no Payload REST/GraphQL endpoint.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE outreach_generation_log (
      request_id uuid PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      request_hash text NOT NULL,
      request jsonb NOT NULL,
      evidence jsonb,
      raw_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
      model text NOT NULL,
      prompt_version text NOT NULL,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete','failed')),
      result jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX outreach_generation_log_user_idx ON outreach_generation_log(user_id,created_at);
  `)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE outreach_generation_log;`)
}
