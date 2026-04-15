import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default pool;

export async function initDB() {
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
  `);
}
