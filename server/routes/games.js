import express from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { game_id, score, metadata } = req.body
    const result = await pool.query(
      `INSERT INTO game_scores (user_id, game_id, score, metadata)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, game_id, score, metadata || {}]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

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
