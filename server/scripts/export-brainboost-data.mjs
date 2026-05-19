import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to server/.env or pass it as an environment variable.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function writeJson(filename, rows) {
  const outputPath = path.join(repoRoot, filename)
  await fs.writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
  return outputPath
}

try {
  const [habitsResult, gamesResult] = await Promise.all([
    pool.query(`
      SELECT id, user_id, sleep_hours, screen_time, physical_activity, date, created_at
      FROM habits
      ORDER BY date ASC, id ASC
    `),
    pool.query(`
      SELECT id, user_id, game_id, score, metadata, played_at, display_name
      FROM game_scores
      ORDER BY played_at ASC, id ASC
    `),
  ])

  const habitsPath = await writeJson('brainboost_habits_export.json', habitsResult.rows)
  const gamesPath = await writeJson('brainboost_game_scores_export.json', gamesResult.rows)

  console.log(`Exported ${habitsResult.rowCount} habit rows to ${habitsPath}`)
  console.log(`Exported ${gamesResult.rowCount} game score rows to ${gamesPath}`)
} finally {
  await pool.end()
}
