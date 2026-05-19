// ─────────────────────────────────────────────────────────────────────────────
// Game score API routes — mounted at /api/games by the main Express server.
//
// Database table: game_scores (id, user_id, game_id, score, metadata, display_name, played_at)
//   user_id      TEXT      — Clerk user ID or guest_ prefixed ID
//   game_id      TEXT      — 'reaction', 'memory', 'stroop', 'visual_pattern', 'mental_math'
//   score        INTEGER   — primary metric (reaction/memory: lower=better; others: higher=better)
//   metadata     JSONB     — additional context per game type
//   display_name TEXT      — "Cosmic Quokka #4821" for guests, first name for signed-in users
//   played_at    TIMESTAMPTZ — auto-set by the database on insert
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// ── POST /api/games ──────────────────────────────────────────────────────────
// Saves a new game result. Accepts display_name from the frontend.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { game_id, score, metadata, display_name } = req.body

    // Add display_name column if it doesn't exist yet (safe to run repeatedly).
    await pool.query(`
      ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS display_name TEXT
    `)

    const result = await pool.query(
      `INSERT INTO game_scores (user_id, game_id, score, metadata, display_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, game_id, score, metadata || {}, display_name || 'Anonymous']
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/games ───────────────────────────────────────────────────────────
// Returns the 20 most recent game scores for the authenticated user.
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM game_scores WHERE user_id = $1 ORDER BY played_at DESC LIMIT 20`,
      [req.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/games/leaderboard/:gameId ───────────────────────────────────────
// Returns the top 10 players for a given game by their personal best score.
// Public endpoint — no auth required so guests can view the leaderboard.
//
// Score direction varies by game:
//   reaction     → lower ms is better  (ORDER BY score ASC)
//   memory       → lower moves is better (ORDER BY score ASC)
//   stroop       → higher % is better  (ORDER BY score DESC)
//   visual_pattern → higher level is better (ORDER BY score DESC)
//   mental_math  → higher correct is better (ORDER BY score DESC)
//
// Uses a subquery to get each user's personal best first, then ranks globally.
router.get('/leaderboard/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const lowerIsBetter = ['reaction', 'memory'].includes(gameId)

    const orderDir = lowerIsBetter ? 'ASC' : 'DESC'

    // Subquery: get each user's best score and their most recent display_name.
    // DISTINCT ON (user_id) with ORDER BY gives the best score row per user.
    const result = await pool.query(`
      SELECT display_name, best_score, user_id
      FROM (
        SELECT DISTINCT ON (user_id)
          user_id,
          score AS best_score,
          COALESCE(display_name, 'Anonymous') AS display_name
        FROM game_scores
        WHERE game_id = $1
        ORDER BY user_id, score ${orderDir}
      ) best_per_user
      ORDER BY best_score ${orderDir}
      LIMIT 10
    `, [gameId])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
