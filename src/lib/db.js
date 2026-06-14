import { Pool } from "pg";

// Reuse the pool across hot reloads in dev / across invocations in serverless
const globalForPg = globalThis;
if (!globalForPg._pgPool) {
  globalForPg._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
}

const pool = globalForPg._pgPool;
export default pool;

export async function initDB() {
  if (globalForPg._pgInitialized) return;
  globalForPg._pgInitialized = true;
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      email           VARCHAR(255) UNIQUE NOT NULL,
      password_hash   TEXT NOT NULL,
      is_verified     BOOLEAN DEFAULT FALSE,
      credits         INTEGER DEFAULT 0,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      code       VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      attempts   INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id                 SERIAL PRIMARY KEY,
      user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
      flutterwave_ref    VARCHAR(255) UNIQUE,
      amount             NUMERIC(10, 2),
      currency           VARCHAR(10) DEFAULT 'NGN',
      bundle_type        VARCHAR(50),
      credits_purchased  INTEGER DEFAULT 0,
      status             VARCHAR(50) DEFAULT 'pending',
      created_at         TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
      job_id          VARCHAR(255) UNIQUE NOT NULL,
      status          VARCHAR(50) DEFAULT 'processing',
      credits_used    INTEGER DEFAULT 0,
      fail_reason     VARCHAR(100),
      report          JSONB,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
    );

    CREATE TABLE IF NOT EXISTS credit_log (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      delta       INTEGER NOT NULL,
      reason      VARCHAR(100) NOT NULL,
      ref         VARCHAR(255),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scan_jobs (
      id          SERIAL PRIMARY KEY,
      scan_job_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      status      VARCHAR(50) DEFAULT 'processing',
      result      JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_scan_jobs_id ON scan_jobs(scan_job_id);

    CREATE INDEX IF NOT EXISTS idx_prt_token   ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

    -- Migrate existing users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
    ALTER TABLE users DROP COLUMN IF EXISTS is_paid;
    ALTER TABLE users DROP COLUMN IF EXISTS plan_type;
    ALTER TABLE users DROP COLUMN IF EXISTS plan_expires_at;

    -- Migrate existing payments table
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS bundle_type VARCHAR(50);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;

    -- Migrate existing jobs table
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fail_reason VARCHAR(100);

    -- Migrate existing verification_codes table
    ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
  `);
}
