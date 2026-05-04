// ─────────────────────────────────────────────────────────────────────────────
// Game score API routes — mounted at /api/games by the main Express server.
//
// Database table: game_scores (id, user_id, game_id, score, metadata, played_at)
//   user_id   TEXT      — Clerk user ID or guest_ prefixed ID
//   game_id   TEXT      — which game: 'reaction', 'memory', or 'stroop'
//   score     INTEGER   — primary metric for the game:
//                           reaction → average reaction time in milliseconds (lower = better)
//                           memory  → number of card-flip moves (lower = better)
//                           stroop  → accuracy percentage 0-100 (higher = better)
//   metadata  JSONB     — additional context per game type:
//                           reaction → { rounds: [ms, ms, ...] }
//                           memory  → { time_seconds: number }
//                           stroop  → { total_rounds: number, accuracy: number }
//   played_at TIMESTAMPTZ — auto-set by the database on insert
//
// All routes require authentication via the requireAuth middleware.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// ── POST /api/games ──────────────────────────────────────────────────────────
// Saves a new game result for the authenticated user.
// Called at the end of each game session (when all rounds are complete or time runs out).
// Returns the newly created row (including id and played_at timestamp).
router.post('/', requireAuth, async (req, res) => {
  try {
    const { game_id, score, metadata } = req.body
    const result = await pool.query(
      `INSERT INTO game_scores (user_id, game_id, score, metadata)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, game_id, score, metadata || {}]  // default to empty object if no metadata provided
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/games ───────────────────────────────────────────────────────────
// Returns the 20 most recent game scores for the authenticated user.
// Ordered by played_at DESC so the most recent result appears first.
// Used by the Progress page to render the game history section.
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

export default router
