import { pool } from "@workspace/db";

let migrationPromise: Promise<void> | null = null;

export async function ensurePlatformSchema(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runPlatformMigration();
  }
  await migrationPromise;
}

async function runPlatformMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS studies (
        slug text PRIMARY KEY NOT NULL,
        responses_table text NOT NULL UNIQUE,
        short_title text NOT NULL,
        full_title text NOT NULL,
        organization text DEFAULT 'AGA Health Foundation' NOT NULL,
        location text,
        principal_investigator text,
        ethics_reference text,
        contact_email text,
        contact_phone text,
        data_retention text,
        estimated_minutes text,
        status text DEFAULT 'draft' NOT NULL,
        opens_at timestamptz,
        closes_at timestamptz,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS studies_status_idx ON studies (status)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_admins (
        id serial PRIMARY KEY NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        last_login_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_user_study_access (
        id serial PRIMARY KEY NOT NULL,
        admin_user_id integer NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        study_slug text NOT NULL REFERENCES studies(slug) ON DELETE CASCADE,
        role text NOT NULL,
        granted_at timestamptz DEFAULT now() NOT NULL,
        granted_by_system_admin_id integer REFERENCES system_admins(id) ON DELETE SET NULL
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS admin_user_study_access_user_study_uidx
        ON admin_user_study_access (admin_user_id, study_slug)
    `);

    const { rows: surveysExists } = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'surveys'
      ) AS exists
    `);
    const { rows: renamedExists } = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'telehealth_readiness_surveys'
      ) AS exists
    `);

    if (surveysExists[0]?.exists && !renamedExists[0]?.exists) {
      await client.query(`ALTER TABLE surveys RENAME TO telehealth_readiness_surveys`);
    }

    const { rows: slugCol } = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'telehealth_readiness_surveys'
          AND column_name = 'study_slug'
      ) AS exists
    `);
    if (slugCol[0]?.exists) {
      await client.query(
        `ALTER TABLE telehealth_readiness_surveys DROP COLUMN study_slug`,
      );
    }

    await client.query(`
      INSERT INTO studies (
        slug, responses_table, short_title, full_title, organization, location,
        principal_investigator, ethics_reference, contact_email, contact_phone,
        data_retention, estimated_minutes, status
      ) VALUES
      (
        'telehealth-readiness',
        'telehealth_readiness_surveys',
        'Telehealth Readiness Survey',
        'Assessment of Telehealth Readiness Among AGA Obuasi Mine Employees and Contractors',
        'AGA Health Foundation',
        'Obuasi Mine, Ghana',
        '[Numan Usman]',
        '[Ethics / IRB Approval Reference]',
        '[nusman@agahealthfoundation.org]',
        '[+233 20 648 4034]',
        'Anonymous survey responses are retained for the duration of the research study and reported in aggregate.',
        '5–8',
        'active'
      ),
      (
        'clinician-telehealth-readiness',
        'clinician_telehealth_readiness_surveys',
        'Clinician Telehealth Readiness Survey',
        'Assessment of Telehealth Readiness Among AGA Health Foundation Clinicians',
        'AGA Health Foundation',
        'Obuasi Mine, Ghana',
        NULL, NULL, NULL, NULL, NULL, NULL,
        'active'
      )
      ON CONFLICT (slug) DO NOTHING
    `);

    await client.query(`
      UPDATE studies SET status = 'active'
      WHERE slug = 'clinician-telehealth-readiness' AND status = 'draft'
    `);

    await client.query(`
      INSERT INTO admin_user_study_access (admin_user_id, study_slug, role)
      SELECT id, 'telehealth-readiness', role
      FROM admin_users
      WHERE status = 'approved'
      ON CONFLICT (admin_user_id, study_slug) DO NOTHING
    `);

    await client.query(`
      INSERT INTO admin_user_study_access (admin_user_id, study_slug, role)
      SELECT id, 'clinician-telehealth-readiness', role
      FROM admin_users
      WHERE status = 'approved'
      ON CONFLICT (admin_user_id, study_slug) DO NOTHING
    `);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    migrationPromise = null;
    throw err;
  } finally {
    client.release();
  }
}
