/**
 * Idempotent prospectus schema migration.
 * Run: pnpm db:migrate:prospectus  (from repo root; loads .env automatically)
 */
import { loadRootEnv } from "./load-root-env.ts";

loadRootEnv();

const { pool } = await import("../src/index.ts");

const PROSPECTUS_SQL = `
CREATE TABLE IF NOT EXISTS prospectus_submissions (
  id serial PRIMARY KEY NOT NULL,
  public_id uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  status text DEFAULT 'draft' NOT NULL,
  submitter_email text NOT NULL,
  submitter_name text NOT NULL,
  submitter_user_id integer REFERENCES admin_users(id) ON DELETE SET NULL,
  title text DEFAULT '' NOT NULL,
  principal_investigator text DEFAULT '' NOT NULL,
  co_investigators jsonb DEFAULT '[]'::jsonb NOT NULL,
  organization text DEFAULT 'AGA Health Foundation' NOT NULL,
  department text,
  background text DEFAULT '' NOT NULL,
  research_problem text DEFAULT '' NOT NULL,
  research_questions jsonb DEFAULT '[]'::jsonb NOT NULL,
  aims text DEFAULT '' NOT NULL,
  objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
  literature_overview text DEFAULT '' NOT NULL,
  theoretical_framework text,
  methodology jsonb DEFAULT '{"approach":"quantitative","design":"","population":"","sampling":"","instruments":"","analysis":""}'::jsonb NOT NULL,
  significance text DEFAULT '' NOT NULL,
  ethics_notes text DEFAULT '' NOT NULL,
  identifiable_data boolean DEFAULT false NOT NULL,
  ethics_reference text,
  data_retention text,
  timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
  references_text text DEFAULT '' NOT NULL,
  proposed_slug text,
  study_type text DEFAULT 'survey' NOT NULL,
  study_template text DEFAULT 'custom' NOT NULL,
  parent_prospectus_id integer REFERENCES prospectus_submissions(id) ON DELETE SET NULL,
  is_amendment boolean DEFAULT false NOT NULL,
  linked_study_slug text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS prospectus_submissions_status_idx ON prospectus_submissions (status);
CREATE INDEX IF NOT EXISTS prospectus_submissions_submitter_email_idx ON prospectus_submissions (submitter_email);
CREATE INDEX IF NOT EXISTS prospectus_submissions_linked_study_slug_idx ON prospectus_submissions (linked_study_slug);

CREATE TABLE IF NOT EXISTS prospectus_reviews (
  id serial PRIMARY KEY NOT NULL,
  prospectus_id integer NOT NULL REFERENCES prospectus_submissions(id) ON DELETE CASCADE,
  reviewer_system_admin_id integer NOT NULL REFERENCES system_admins(id) ON DELETE RESTRICT,
  decision text NOT NULL,
  comments text DEFAULT '' NOT NULL,
  is_internal boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS prospectus_reviews_prospectus_id_idx ON prospectus_reviews (prospectus_id);

CREATE TABLE IF NOT EXISTS prospectus_approvals (
  id serial PRIMARY KEY NOT NULL,
  prospectus_id integer NOT NULL REFERENCES prospectus_submissions(id) ON DELETE CASCADE,
  approval_role text NOT NULL,
  system_admin_id integer NOT NULL REFERENCES system_admins(id) ON DELETE RESTRICT,
  decision text NOT NULL,
  comments text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS prospectus_approvals_prospectus_role_uidx
  ON prospectus_approvals (prospectus_id, approval_role);
CREATE INDEX IF NOT EXISTS prospectus_approvals_prospectus_id_idx ON prospectus_approvals (prospectus_id);

CREATE TABLE IF NOT EXISTS prospectus_attachments (
  id serial PRIMARY KEY NOT NULL,
  prospectus_id integer NOT NULL REFERENCES prospectus_submissions(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  blob_pathname text NOT NULL,
  blob_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS prospectus_attachments_prospectus_id_idx ON prospectus_attachments (prospectus_id);
`;

async function addStudiesProspectusColumns(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE studies
      ADD COLUMN IF NOT EXISTS prospectus_id integer REFERENCES prospectus_submissions(id) ON DELETE RESTRICT,
      ADD COLUMN IF NOT EXISTS prospectus_exempt boolean DEFAULT false NOT NULL
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS studies_prospectus_id_idx ON studies (prospectus_id)
  `);
}

async function grandfatherExistingStudies(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    UPDATE studies
    SET prospectus_exempt = true
    WHERE slug IN ('telehealth-readiness', 'clinician-telehealth-readiness')
      AND prospectus_exempt = false
  `);
  console.log("Grandfathered existing studies as prospectus_exempt");
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(PROSPECTUS_SQL);
    await addStudiesProspectusColumns(client);
    await grandfatherExistingStudies(client);
    await client.query("COMMIT");
    console.log("Prospectus migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  if (err instanceof Error && err.message.includes("DATABASE_URL must be set")) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env in the repo root and set your PostgreSQL URL.",
    );
  }
  console.error(err);
  process.exit(1);
});
