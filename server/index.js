// ─────────────────────────────────────────────────────────────────────────────
// BrainBoost Express server — main entry point.
//
// Responsibilities:
//   1. Load environment variables from .env via dotenv.
//   2. Configure CORS so the React frontend can make API calls.
//   3. Parse JSON request bodies.
//   4. Mount API route handlers.
//   5. Start the HTTP listener.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import habitRoutes from './routes/habits.js'
import gameRoutes from './routes/games.js'

const app = express()

// CORS: only the listed origins are allowed to make cross-origin requests.
//   - 'http://localhost:5173' is the Vite dev server used during local development.
//   - The production URL is the deployed frontend on the custom domain.
// Requests from any other origin will be blocked by the browser's same-origin policy.
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://iteration2.ta31brainboost.me'
  ]
}))

// express.json(): parses the request body as JSON and exposes it on req.body.
// Required for all POST and PUT routes that receive habit or game data.
app.use(express.json())

// Mount the habit CRUD router under /api/habits.
// Handles: GET / (list), POST / (create), PUT /:date (update), GET /streak.
app.use('/api/habits', habitRoutes)

// Mount the game score router under /api/games.
// Handles: POST / (save score), GET / (list recent scores).
app.use('/api/games', gameRoutes)

// Health-check endpoint — returns a simple JSON payload so the hosting platform
// (Railway) and load balancers can confirm the process is alive and responding.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Start listening on port 3001.
// The frontend points VITE_API_URL at http://localhost:3001/api during development.
const PORT = 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
