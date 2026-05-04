// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL connection pool — shared across all API route handlers.
//
// The pg.Pool class manages a set of persistent database connections so that
// individual requests do not need to open and close a new TCP connection each time.
// The pool is initialised once when the module is first imported and reused thereafter.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import pg from 'pg'
const { Pool } = pg

// Pool configuration:
//   connectionString: the full PostgreSQL URL (e.g. postgresql://user:pass@host:5432/db).
//                     Read from the DATABASE_URL environment variable set in server/.env
//                     or injected by the hosting platform (Railway, Supabase, etc.).
//   ssl.rejectUnauthorized=false: required when connecting to cloud-hosted databases that
//                                 present self-signed TLS certificates (common on Railway).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Export the pool as the default export.
// Route files import this module and call pool.query() to run parameterised SQL.
export default pool
