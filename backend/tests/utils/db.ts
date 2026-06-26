import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

let pool: Pool | null = null;

export function getTestPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function setupTestDb(): Promise<void> {
  const client = await getTestPool().connect();
  try {
    const migrationPath = path.join(__dirname, '../../../database/migrations/001_initial_schema.sql');
    const seedPath = path.join(__dirname, '../../../database/seeds/001_species.sql');

    const migration = fs.readFileSync(migrationPath, 'utf8');
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Start from a clean schema so migration changes are always applied identically.
    await client.query(`
      DROP EXTENSION IF EXISTS postgis CASCADE;
      DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
    `);

    await client.query(migration);
    await client.query(seed);
  } finally {
    client.release();
  }
}

export async function clearTestDb(): Promise<void> {
  const client = await getTestPool().connect();
  try {
    await client.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
        ) LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
  } finally {
    client.release();
  }
}

export async function reseedSpecies(): Promise<void> {
  const client = await getTestPool().connect();
  try {
    const seedPath = path.join(__dirname, '../../../database/seeds/001_species.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await client.query(seed);
  } finally {
    client.release();
  }
}

export async function closeTestDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
