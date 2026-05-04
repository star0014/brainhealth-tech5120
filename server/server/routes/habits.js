import express from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/habits - get all habits for logged in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM habits WHERE user_id = $1 ORDER BY date DESC',
      [req.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/habits - save today's check-in
router.post('/', requireAuth, async (req, res) => {
  try {
    const { sleep_hours, screen_time, physical_activity, date } = req.body

    // prevent duplicate check-in for same day
    const existing = await pool.query(
      'SELECT id FROM habits WHERE user_id = $1 AND date = $2',
      [req.userId, date]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already checked in today' })
    }

    const result = await pool.query(
      `INSERT INTO habits (user_id, sleep_hours, screen_time, physical_activity, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, sleep_hours, screen_time, physical_activity, date]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/habits/:date - edit today's check-in
router.put('/:date', requireAuth, async (req, res) => {
  try {
    const { sleep_hours, screen_time, physical_activity } = req.body
    const result = await pool.query(
      `UPDATE habits SET sleep_hours=$1, screen_time=$2, physical_activity=$3
       WHERE user_id=$4 AND date=$5 RETURNING *`,
      [sleep_hours, screen_time, physical_activity, req.userId, req.params.date]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No check-in found for this date' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
