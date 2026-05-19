// ─────────────────────────────────────────────────────────────────────────────
// BrainBoost Express server — main entry point.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import habitRoutes from './routes/habits.js'
import gameRoutes from './routes/games.js'

const app = express()

// CORS: all iteration frontends are allowed.
// Add new iteration domains here as the project progresses.
const allowedOrigins = [
  'http://localhost:5173',
  'https://iteration2.ta31brainboost.me',
  'https://iteration3.ta31brainboost.me',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Railway health checks)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  }
}))

app.use(express.json())

app.use('/api/habits', habitRoutes)
app.use('/api/games', gameRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Railway injects PORT automatically — never hardcode 3001 in production
// or Railway will think the process crashed and restart it in a loop.
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
